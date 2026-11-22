import { createClientOpcional } from "@/lib/supabase/server";

export type Cargo = "GESTOR" | "FUNCIONARIO" | null;

export const HOME_POR_CARGO: Record<"GESTOR" | "FUNCIONARIO" | "CLIENTE", string> = {
  GESTOR: "/gerente",
  FUNCIONARIO: "/home-funcionario",
  CLIENTE: "/home-cliente",
};

export function homePorCargo(cargo: Cargo): string {
  if (cargo === "GESTOR") return HOME_POR_CARGO.GESTOR;
  if (cargo === "FUNCIONARIO") return HOME_POR_CARGO.FUNCIONARIO;
  return HOME_POR_CARGO.CLIENTE;
}

// Papel não é coluna: sai do vínculo com a casa (sem vínculo = familiar).
export async function cargoDoUsuario(): Promise<Cargo> {
  const supabase = await createClientOpcional();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("vinculo_ilpi")
    .select("cargo")
    .eq("id_usuario", user.id)
    .eq("ativo", true);

  const cargos = (data ?? []).map((linha) => linha.cargo as string);
  if (cargos.includes("GESTOR")) return "GESTOR";
  if (cargos.includes("FUNCIONARIO")) return "FUNCIONARIO";
  return null;
}