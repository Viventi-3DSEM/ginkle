// Service Worker do Ginkle — habilita instalação como PWA, cache seguro de
// assets/páginas públicas, suporte offline ao turno do funcionário
// (/funcionario e /funcionario/novo-registro) e fallback /offline.html.
// O cache do turno é apagado automaticamente ao clicar em "Sair".

const STATIC_CACHE = "ginkle-static-v3";
const PAGES_CACHE = "ginkle-pages-v3";
const TURNO_CACHE = "ginkle-turno-v3";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [OFFLINE_URL, "/", "/icons/icon-192.png"];
const ROTAS_TURNO = ["/funcionario", "/funcionario/novo-registro"];

function ehRotaPublica(pathname) {
  return (
    pathname === "/" ||
    pathname === "/sobre" ||
    pathname === "/casas" ||
    pathname.startsWith("/casas/") ||
    pathname === "/termos" ||
    pathname === "/privacidade"
  );
}

function ehRotaTurno(pathname) {
  return pathname === "/funcionario" || pathname === "/funcionario/novo-registro";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const ativos = new Set([STATIC_CACHE, PAGES_CACHE, TURNO_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !ativos.has(key)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const tipo = event.data?.type;

  if (tipo === "PRECACHE_TURNO") {
    event.waitUntil(
      caches.open(TURNO_CACHE).then(async (cache) => {
        for (const rota of ROTAS_TURNO) {
          try {
            const res = await fetch(rota, {
              credentials: "same-origin",
              headers: { Accept: "text/html" },
            });
            if (res.ok && !res.redirected) {
              await cache.put(rota, res.clone());
            }
          } catch {
            // Sem conexão durante pré-cache: ignora e tenta na próxima reconexão
          }
        }
      }),
    );
    return;
  }

  if (tipo === "LIMPAR_TURNO") {
    event.waitUntil(caches.delete(TURNO_CACHE));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação de documento: tenta rede primeiro; se cair offline, serve a
  // versão em cache (rotas públicas ou turno do funcionário) ou /offline.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected) {
            if (ehRotaPublica(url.pathname)) {
              const copia = response.clone();
              caches.open(PAGES_CACHE).then((cache) => cache.put(request, copia));
            } else if (ehRotaTurno(url.pathname)) {
              const copia = response.clone();
              caches.open(TURNO_CACHE).then((cache) => cache.put(url.pathname, copia));
            }
          }
          return response;
        })
        .catch(async () => {
          if (ehRotaTurno(url.pathname)) {
            const cacheTurno = await caches.open(TURNO_CACHE);
            const cachedTurno = await cacheTurno.match(url.pathname);
            if (cachedTurno) return cachedTurno;
          }
          if (ehRotaPublica(url.pathname)) {
            const cachePages = await caches.open(PAGES_CACHE);
            const cachedPublic = await cachePages.match(request);
            if (cachedPublic) return cachedPublic;
          }
          const offline = await caches.match(OFFLINE_URL);
          return offline || new Response("Sem conexão.", { status: 503 });
        }),
    );
    return;
  }

  // Assets estáticos imutáveis: cache-first com preenchimento sob demanda.
  const ehEstatico =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest";

  if (!ehEstatico) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return new Response("", { status: 504 });
      }
    }),
  );
});
