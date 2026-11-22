import Link from "next/link";
import { Plus } from "lucide-react";
import CasaCard from "@/components/painel/CasaCard";
import { painelDoGestor } from "@/lib/painel/dados";

export const metadata = { title: "Minhas casas" };

export default async function MinhasCasasPage() {
  const { casas, resumo } = await painelDoGestor();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Minhas casas</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {casas.length === 0
              ? "Nenhuma casa cadastrada ainda."
              : `${casas.length} casa${casas.length === 1 ? "" : "s"} sob sua gestão, com ${resumo.residentes} residente${resumo.residentes === 1 ? "" : "s"} ativo${resumo.residentes === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link
          href="/gerente/casas/nova"
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nova casa
        </Link>
      </header>

      {casas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-heading text-lg font-semibold">Comece cadastrando a casa</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Nome, CNPJ e endereço já bastam para a página pública existir. Depois você
            completa vagas, planos e a equipe.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {casas.map((casa) => (
            <CasaCard key={casa.id} casa={casa} />
          ))}
        </div>
      )}
    </div>
  );
}
