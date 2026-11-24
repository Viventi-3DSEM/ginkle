import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { destinoSeguro } from "@/lib/auth/destino";

function codigoErroCallback(bruto: string): string {
  const m = bruto.toLowerCase();
  if (m.includes("expired") || m.includes("otp_expired")) return "link-expirado";
  if (m.includes("access_denied")) return "acesso-negado";
  return "erro-autenticacao";
}

function ehSessaoRecovery(accessToken?: string): boolean {
  if (!accessToken) return false;
  const partes = accessToken.split(".");
  if (partes.length < 2) return false;
  try {
    const json = Buffer.from(partes[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { amr?: Array<{ method?: string } | string> };
    return (
      Array.isArray(payload.amr) &&
      payload.amr.some((item) =>
        typeof item === "string" ? item === "recovery" : item?.method === "recovery",
      )
    );
  } catch {
    return false;
  }
}

// Destino dos links do e-mail: troca o ?code= (PKCE) pela sessão em cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const erro = searchParams.get("error_description") ?? searchParams.get("error");
  const nextExplicito = destinoSeguro(searchParams.get("next"));
  const typeRecovery = searchParams.get("type") === "recovery";

  if (erro) {
    return NextResponse.redirect(`${origin}/login?erro=${codigoErroCallback(erro)}`);
  }

  if (!code || !supabaseConfigurado()) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link-expirado`);
  }

  const destino =
    nextExplicito ??
    (typeRecovery || ehSessaoRecovery(data.session?.access_token)
      ? "/redefinir-senha"
      : "/cliente");

  return NextResponse.redirect(`${origin}${destino}`);
}