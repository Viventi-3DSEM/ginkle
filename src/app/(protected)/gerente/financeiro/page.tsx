import Link from "next/link";
import { Building2 } from "lucide-react";
import GerenciadorFinanceiro from "@/components/painel/GerenciadorFinanceiro";
import { financeiroDoGestor } from "@/lib/painel/dados";

export const metadata = { title: "Financeiro" };

type Props = {
  searchParams: Promise<{ casa?: string }>;
};

export default async function FinanceiroGestorPage({ searchParams }: Props) {
  const [params, { casas, planos, candidatos, assinaturas }] = await Promise.all([
    searchParams,
    financeiroDoGestor(),
  ]);

  const agora = new Date();
  const hojeIso = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(agora);

  const mais30d = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const proximoVencimentoIso = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(mais30d);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Financeiro e assinantes
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Acompanhe mensalidades das famílias, lance faturas e registre pagamentos recebidos.
        </p>
      </header>

      {casas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="mx-auto size-8 text-brand-strong" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Cadastre uma casa primeiro
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Assim que sua instituição estiver cadastrada, você pode acompanhar assinantes e
            faturas por aqui.
          </p>
          <Link
            href="/gerente/casas/nova"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Cadastrar casa
          </Link>
        </div>
      ) : (
        <GerenciadorFinanceiro
          key={params.casa ?? ""}
          casas={casas}
          planos={planos}
          candidatos={candidatos}
          assinaturas={assinaturas}
          casaInicialId={params.casa}
          hojeIso={hojeIso}
          proximoVencimentoIso={proximoVencimentoIso}
        />
      )}
    </div>
  );
}
