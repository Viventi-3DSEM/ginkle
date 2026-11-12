// O Supabase trocou anon/service_role por sb_publishable_/sb_secret_.
// As antigas seguem valendo até o fim de 2026, por isso aceitamos os dois nomes.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

export const SUPABASE_PUBLISHABLE_KEY =
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "").trim();

export const SUPABASE_SECRET_KEY =
  (process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "").trim();

/** O site inteiro funciona sem Supabase: só o banco e o login ficam desligados. */
export function supabaseConfigurado(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;
}

export function exigirConfiguracao(): void {
  if (!supabaseConfigurado()) {
    throw new Error(
      "Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.",
    );
  }
}