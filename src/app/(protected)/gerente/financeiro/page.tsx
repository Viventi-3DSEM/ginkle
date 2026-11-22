import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import GerenciadorFinanceiro from "@/components/painel/GerenciadorFinanceiro";
import { financeiroDoGestor } from "@/lib/painel/dados";
import { reais } from "@/lib/painel/formato";

export const metadata = { title: "Financeiro" };

function Stat({
  rotulo,
  valor,
  detalhe,
  Icone,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  Icone: LucideIcon;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {rotulo}
        </p>
        <Icone className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold leading-none">{valor}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

export default async function FinanceiroGestorPage() {
  const { casas, planos, candidatos, assinaturas, resumo } = await financeiroDoGestor();

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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              rotulo="Assinaturas ativas"
              valor={String(resumo.assinaturasAtivas)}
              detalhe="Famílias com plano ativo"
              Icone={Users}
            />
            <Stat
              rotulo="Receita mensal"
              valor={`R$ ${reais(resumo.receitaMensal)}`}
              detalhe="Soma dos planos ativos"
              Icone={Wallet}
            />
            <Stat
              rotulo="Em aberto"
              valor={`R$ ${reais(resumo.totalEmAberto)}`}
              detalhe={
                resumo.faturasAtrasadas > 0
                  ? `${resumo.faturasAtrasadas} fatura${resumo.faturasAtrasadas === 1 ? "" : "s"} em atraso`
                  : "Pendentes de pagamento"
              }
              Icone={Clock}
            />
            <Stat
              rotulo="Total recebido"
              valor={`R$ ${reais(resumo.totalPago)}`}
              detalhe="Faturas marcadas como pagas"
              Icone={CheckCircle2}
            />
          </div>

          <GerenciadorFinanceiro
            casas={casas}
            planos={planos}
            candidatos={candidatos}
            assinaturas={assinaturas}
            hojeIso={hojeIso}
            proximoVencimentoIso={proximoVencimentoIso}
          />
        </>
      )}
    </div>
  );
}
