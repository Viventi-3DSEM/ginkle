import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";

// Para templates de e-mail que usam {{ .TokenHash }} (Settings -> Auth -> Email Templates):
// <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/cliente";
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/cliente";

  if (!tokenHash || !type || !supabaseConfigurado()) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link-expirado`);
  }

  return NextResponse.redirect(`${origin}${destino}`);
}