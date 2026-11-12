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

export async function createClientOpcional() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;
  return createClient();
}