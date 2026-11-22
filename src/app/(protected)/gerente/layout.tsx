import { redirect } from "next/navigation";
import PainelShell from "@/components/painel/PainelShell";
import { usuarioAtual } from "@/lib/painel/dados";

// O middleware já barra quem não é gestor; aqui é só para o cabeçalho ter o nome.
export default async function GerenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login?next=/gerente");

  return <PainelShell usuario={usuario}>{children}</PainelShell>;
}
