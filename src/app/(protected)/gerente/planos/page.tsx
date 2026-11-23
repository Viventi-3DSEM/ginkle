import Link from "next/link";
import { Building2 } from "lucide-react";
import GerenciadorPlanos from "@/components/painel/GerenciadorPlanos";
import { planosDoGestor } from "@/lib/painel/dados";

export const metadata = { title: "Planos" };

type Props = {
  searchParams: Promise<{ casa?: string }>;
};

export default async function PlanosPage({ searchParams }: Props) {
  const [params, { casas, planos }] = await Promise.all([searchParams, planosDoGestor()]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Planos e mensalidades
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Defina as opções de acomodação e os valores mensais das suas casas.
        </p>
      </header>

      {casas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="mx-auto size-8 text-brand-strong" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Cadastre uma casa primeiro
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Assim que sua instituição estiver cadastrada, você pode criar e gerenciar os planos
            dela por aqui.
          </p>
          <Link
            href="/gerente/casas/nova"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Cadastrar casa
          </Link>
        </div>
      ) : (
        <GerenciadorPlanos
          key={params.casa ?? ""}
          casas={casas}
          planos={planos}
          casaInicialId={params.casa}
        />
      )}
    </div>
  );
}
