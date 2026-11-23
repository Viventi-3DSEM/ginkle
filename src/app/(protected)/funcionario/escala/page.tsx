import type { Metadata } from "next";
import MinhaEscala from "@/components/funcionario/MinhaEscala";
import { escalaDoFuncionario } from "@/lib/funcionario/dados";
import { chaveDia } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Minha escala" };

export default async function EscalaFuncionarioPage() {
  const dados = await escalaDoFuncionario();
  const diaHoje = chaveDia(new Date());

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Minha escala</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe seus próximos plantões e consulte a escala geral da equipe para passagem de
          turno.
        </p>
      </header>

      <MinhaEscala dados={dados} diaHoje={diaHoje} />
    </div>
  );
}
