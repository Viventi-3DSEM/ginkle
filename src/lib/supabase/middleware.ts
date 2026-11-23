import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  supabaseConfigurado,
} from "./env";

/** Áreas que exigem sessão. */
const AREAS_PROTEGIDAS: { prefixo: string; cargo?: "GESTOR" | "FUNCIONARIO" }[] = [
  { prefixo: "/gerente", cargo: "GESTOR" },
  { prefixo: "/home-funcionario", cargo: "FUNCIONARIO" },
  { prefixo: "/cliente" },
  { prefixo: "/home-cliente" },
  // Porta de entrada do gestor: só exige sessão, porque é aqui que a pessoa
  // deixa de ser familiar e passa a ter vínculo de GESTOR com a primeira casa.
  { prefixo: "/cadastrar-instituicao" },
];

/** Telas de autenticação: logado que cai aqui vai para a própria home. */
const TELAS_AUTH = ["/login", "/cadastro"];

function casaDaRota(pathname: string) {
  return AREAS_PROTEGIDAS.find(
    (area) => pathname === area.prefixo || pathname.startsWith(`${area.prefixo}/`),
  );
}

// Renova a sessão a cada request (com @supabase/ssr o refresh grava cookie novo)
// e aplica os desvios por papel.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const destinoAtual = `${pathname}${request.nextUrl.search}`;
  const area = casaDaRota(pathname);

  // sem Supabase não há sessão: protegida cai no login (sem early-return, pra não abrir a área)
  if (!supabaseConfigurado()) {
    if (area) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", destinoAtual);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Visitante sem cookie de sessão em rota pública: evita inicializar Auth desnecessariamente.
  const temCookieSessao = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!temCookieSessao && !area && !TELAS_AUTH.includes(pathname)) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims valida a assinatura ES256 localmente (sem round-trip ao Auth quando o
  // token ainda está válido) e renova automaticamente via getSession quando expira.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims?.sub === "string" && claimsData.claims.sub
      ? claimsData.claims.sub
      : null;

  if (!userId) {
    if (area) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", destinoAtual);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Só consulta o vínculo quando o desvio depende dele.
  const precisaCargo = Boolean(area?.cargo) || TELAS_AUTH.includes(pathname);
  let cargo: string | null = null;

  if (precisaCargo) {
    const { data } = await supabase
      .from("vinculo_ilpi")
      .select("cargo")
      .eq("id_usuario", userId)
      .eq("ativo", true);

    const cargos = (data ?? []).map((linha) => linha.cargo as string);
    cargo = cargos.includes("GESTOR")
      ? "GESTOR"
      : cargos.includes("FUNCIONARIO")
        ? "FUNCIONARIO"
        : null;
  }

  const home =
    cargo === "GESTOR"
      ? "/gerente"
      : cargo === "FUNCIONARIO"
        ? "/home-funcionario"
        : "/cliente";

  if (TELAS_AUTH.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (area?.cargo && cargo !== area.cargo) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}