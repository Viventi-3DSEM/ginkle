import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardPlus } from "lucide-react";
import HistoricoRegistros from "@/components/funcionario/HistoricoRegistros";
import { historicoDoFuncionario } from "@/lib/funcionario/dados";
import { chaveDia } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Histórico de registros" };

export default async function HistoricoFuncionarioPage() {
  const { casas, registros, limitado } = await historicoDoFuncionario();
  const diaHoje = chaveDia(new Date());

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Histórico de registros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os cuidados lançados pela equipe e filtre seus próprios registros com
            duplo carimbo de horário.
          </p>
        </div>

        <Link
          href="/funcionario/novo-registro"
          className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ClipboardPlus className="size-4" aria-hidden="true" />
          Novo registro
        </Link>
      </header>

      <HistoricoRegistros
        casas={casas}
        registros={registros}
        diaHoje={diaHoje}
        limitado={limitado}
      />
    </div>
  );
}
