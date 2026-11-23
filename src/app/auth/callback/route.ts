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

// Destino dos links do e-mail: troca o ?code= (PKCE) pela sessão em cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const erro = searchParams.get("error_description") ?? searchParams.get("error");
  const destino = destinoSeguro(searchParams.get("next")) ?? "/cliente";

  if (erro) {
    return NextResponse.redirect(`${origin}/login?erro=${codigoErroCallback(erro)}`);
  }

  if (!code || !supabaseConfigurado()) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link-expirado`);
  }

  return NextResponse.redirect(`${origin}${destino}`);
}