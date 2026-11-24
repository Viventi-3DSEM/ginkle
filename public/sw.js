// Service Worker do Ginkle — habilita instalação como PWA, cache seguro de
// assets/páginas públicas e fallback offline próprio (/offline.html).
// Rotas autenticadas nunca têm HTML salvo em cache para evitar sessão defasada
// ou vazamento de dados de residentes entre usuários no mesmo aparelho.

const STATIC_CACHE = "ginkle-static-v2";
const PAGES_CACHE = "ginkle-pages-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [OFFLINE_URL, "/", "/icons/icon-192.png"];

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
  const ativos = new Set([STATIC_CACHE, PAGES_CACHE]);
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação de documento: tenta rede primeiro; se cair offline, serve a
  // versão em cache (apenas rotas públicas) ou a tela /offline.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && ehRotaPublica(url.pathname)) {
            const copia = response.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, copia));
          }
          return response;
        })
        .catch(async () => {
          if (ehRotaPublica(url.pathname)) {
            const cached = await caches.match(request);
            if (cached) return cached;
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
