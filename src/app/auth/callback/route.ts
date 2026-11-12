import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";

// Destino dos links do e-mail: troca o ?code= (PKCE) pela sessão em cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home-cliente";
  const erro = searchParams.get("error_description") ?? searchParams.get("error");

  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/home-cliente";

  if (erro) {
    return NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent(erro)}`);
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