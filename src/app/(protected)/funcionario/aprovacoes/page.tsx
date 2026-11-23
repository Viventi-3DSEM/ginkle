import type { Metadata } from "next";
import CentralAprovacoes from "@/components/funcionario/CentralAprovacoes";
import { aprovacoesDoFuncionario } from "@/lib/funcionario/dados";

export const metadata: Metadata = { title: "Central de aprovações" };

export default async function AprovacoesFuncionarioPage() {
  const dados = await aprovacoesDoFuncionario();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Central de aprovações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analise pedidos de entrada enviados por familiares, aprove ou recuse e já vincule o
          familiar ao residente quando quiser.
        </p>
      </header>

      <CentralAprovacoes dados={dados} />
    </div>
  );
}
