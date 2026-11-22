import { CheckCircle2, ClipboardList, Clock, type LucideIcon } from "lucide-react";
import ListaSolicitacoes from "@/components/portal/ListaSolicitacoes";
import NovaSolicitacaoForm from "@/components/portal/NovaSolicitacaoForm";
import { solicitacoesDoFamiliar } from "@/lib/portal/dados";

export const metadata = { title: "Solicitações" };

type Props = {
  searchParams: Promise<{ casa?: string }>;
};

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
      <p className="mt-3 font-heading text-2xl font-semibold leading-none sm:text-3xl">{valor}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

export default async function SolicitacoesPage({ searchParams }: Props) {
  const [params, dados] = await Promise.all([searchParams, solicitacoesDoFamiliar()]);

  const pendentesIds = dados.adesoes
    .filter((item) => item.status === "PENDENTE")
    .map((item) => item.casaId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Solicitações de entrada
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Envie pedidos para casas de repouso e acompanhe a resposta de cada instituição.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          rotulo="Pendentes"
          valor={String(dados.resumo.pendentes)}
          detalhe="Aguardando retorno da equipe"
          Icone={Clock}
        />
        <Stat
          rotulo="Aprovadas"
          valor={String(dados.resumo.aprovadas)}
          detalhe="Pedidos aceitos pelas instituições"
          Icone={CheckCircle2}
        />
        <Stat
          rotulo="Total de pedidos"
          valor={String(dados.resumo.total)}
          detalhe="Histórico de solicitações da conta"
          Icone={ClipboardList}
        />
      </div>

      <NovaSolicitacaoForm
        key={params.casa ?? ""}
        casas={dados.casasDisponiveis}
        pendentesIds={pendentesIds}
        vinculadasIds={dados.casasVinculadasIds}
        casaInicialSlug={params.casa}
      />

      <ListaSolicitacoes adesoes={dados.adesoes} />
    </div>
  );
}
