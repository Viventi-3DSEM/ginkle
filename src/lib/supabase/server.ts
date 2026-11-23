import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  exigirConfiguracao,
} from "./env";

// Em Server Component o cookie só pode ser lido (set falha): quem renova a sessão
// é o middleware, daí o try/catch no setAll.
export async function createClient() {
  exigirConfiguracao();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component: ignorar. O middleware já cuidou do refresh.
        }
      },
    },
  });
}

// Memoizado por requisição para compartilhar o mesmo cliente entre layout, metadata e página.
export const createClientOpcional = cache(async () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;
  return createClient();
});

export type SessaoUsuario = {
  id: string;
  email: string;
};

/**
 * Valida o JWT localmente via JWKS (ES256) com fallback automático para Auth quando
 * necessário, evitando um round-trip de rede ao Supabase Auth em cada leitura.
 */
export const sessaoAtual = cache(async (): Promise<SessaoUsuario | null> => {
  const supabase = await createClientOpcional();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || typeof sub !== "string" || !sub) return null;

  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  return { id: sub, email };
});
