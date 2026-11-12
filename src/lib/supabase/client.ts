import { createBrowserClient } from "@supabase/ssr";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  exigirConfiguracao,
} from "./env";

// A publishable vai para o navegador de propósito: quem protege os dados é a RLS.
export function createClient() {
  exigirConfiguracao();
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}