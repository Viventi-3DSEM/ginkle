import Link from "next/link";
import { Building2 } from "lucide-react";
import GerenciadorEquipe from "@/components/painel/GerenciadorEquipe";
import GerenciadorEscalaGestor from "@/components/painel/GerenciadorEscalaGestor";
import { equipeDoGestor, escalasDoGestor } from "@/lib/painel/dados";
import { chaveDia } from "@/lib/painel/formato";

export const metadata = { title: "Equipe" };

type Props = {
  searchParams: Promise<{ casa?: string }>;
};

export default async function EquipeGestorPage({ searchParams }: Props) {
  const [params, { casas, membros }, escalas] = await Promise.all([
    searchParams,
    equipeDoGestor(),
    escalasDoGestor(),
  ]);
  const hojeIso = chaveDia(new Date());

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Equipe</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Adicione profissionais às suas casas, defina cargos, controle acessos e monte a escala
          de turnos.
        </p>
      </header>

      {casas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="mx-auto size-8 text-brand-strong" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Cadastre uma casa primeiro
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Assim que sua instituição estiver cadastrada, você pode montar a equipe por aqui.
          </p>
          <Link
            href="/gerente/casas/nova"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Cadastrar casa
          </Link>
        </div>
      ) : (
        <>
          <GerenciadorEquipe
            key={params.casa ?? ""}
            casas={casas}
            membros={membros}
            casaInicialId={params.casa}
          />
          <GerenciadorEscalaGestor
            casas={casas}
            membros={membros}
            turnos={escalas.turnos}
            disponivel={escalas.disponivel}
            hojeIso={hojeIso}
          />
        </>
      )}
    </div>
  );
}
