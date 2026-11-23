import { redirect } from "next/navigation";
import FuncionarioShell from "@/components/funcionario/FuncionarioShell";
import { usuarioDoFuncionario } from "@/lib/funcionario/dados";

export default async function FuncionarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await usuarioDoFuncionario();
  if (!usuario) redirect("/login?next=/funcionario");

  return <FuncionarioShell usuario={usuario}>{children}</FuncionarioShell>;
}
