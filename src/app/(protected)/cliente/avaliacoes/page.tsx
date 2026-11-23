import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import AvaliacaoCasaCard from "@/components/portal/AvaliacaoCasaCard";
import { avaliacoesDoFamiliar } from "@/lib/portal/dados";

export const metadata: Metadata = { title: "Avaliar casa" };

export default async function AvaliacoesFamiliarPage() {
  const casas = await avaliacoesDoFamiliar();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Avaliar casa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compartilhe sua experiência com a instituição onde seu familiar está hospedado para
          ajudar outras famílias a escolher com transparência.
        </p>
      </header>

      {casas.length === 0 ? (
        <section className="rounded-sm border border-border bg-card p-8 text-center">
          <Star className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-lg font-semibold">
            Nenhuma instituição vinculada para avaliar
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Para manter as avaliações reais e confiáveis, apenas familiares com um residente
            vinculado à casa podem publicar uma nota no diretório.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/cliente/solicitacoes"
              className="inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ver solicitações
            </Link>
            <Link
              href="/casas"
              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Explorar casas
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          {casas.map((casa) => (
            <AvaliacaoCasaCard key={casa.casaId} casa={casa} />
          ))}
        </div>
      )}
    </div>
  );
}
