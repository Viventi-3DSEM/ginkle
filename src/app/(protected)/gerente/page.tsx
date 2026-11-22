import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  HeartPulse,
  Star,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import CasaCard from "@/components/painel/CasaCard";
import { painelDoGestor } from "@/lib/painel/dados";
import { dataHora, rotuloTipo } from "@/lib/painel/formato";

export const metadata = { title: "Painel" };

function Stat({
  rotulo,
  valor,
  detalhe,
  Icone,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
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
      <p className="mt-3 font-heading text-3xl font-semibold leading-none">{valor}</p>
      {detalhe ? <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

function Bloco({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
        {acao ? (
          <Link
            href={acao.href}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand-strong"
          >
            {acao.label}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function PainelPage() {
  const { casas, resumo, solicitacoesPendentes, atividade } = await painelDoGestor();

  if (casas.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Painel do gestor</h1>
        <div className="mt-6 rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="mx-auto size-8 text-brand-strong" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Você ainda não gerencia nenhuma casa
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Cadastre a instituição para começar a registrar a rotina da equipe e dar
            visibilidade às famílias.
          </p>
          <Link
            href="/cadastrar-instituicao"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Cadastrar minha instituição
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Painel do gestor</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A rotina das suas casas em números: quem está sob seus cuidados, o que a equipe
          registrou nos últimos sete dias e o que espera resposta.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          rotulo="Casas"
          valor={String(resumo.casas)}
          detalhe={resumo.casas === 1 ? "1 instituição sob sua gestão" : `${resumo.casas} instituições sob sua gestão`}
          Icone={Building2}
        />
        <Stat
          rotulo="Residentes ativos"
          valor={String(resumo.residentes)}
          detalhe="Considera só quem está com status ativo"
          Icone={Users}
        />
        <Stat
          rotulo="Equipe"
          valor={String(resumo.equipe)}
          detalhe="Vínculos ativos nas suas casas"
          Icone={HeartPulse}
        />
        <Stat
          rotulo="Registros (7 dias)"
          valor={String(resumo.registros7d)}
          detalhe="Cuidados, medicamentos, sinais vitais e ocorrências"
          Icone={ClipboardList}
        />
        <Stat
          rotulo="Solicitações"
          valor={String(resumo.solicitacoes)}
          detalhe="Famílias aguardando resposta"
          Icone={UserPlus}
        />
        <Stat
          rotulo="Avaliação média"
          valor={resumo.notaMedia === null ? "—" : resumo.notaMedia.toFixed(1)}
          detalhe={
            resumo.avaliacoes === 0
              ? "Ainda sem avaliações"
              : `${resumo.avaliacoes} avaliaç${resumo.avaliacoes === 1 ? "ão" : "ões"} no diretório`
          }
          Icone={Star}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">Minhas casas</h2>
          <Link
            href="/gerente/casas"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand-strong"
          >
            Ver todas
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="space-y-3">
          {casas.slice(0, 3).map((casa) => (
            <CasaCard key={casa.id} casa={casa} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloco titulo="Últimos registros da equipe">
          {atividade.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nada registrado nos últimos sete dias. Os registros aparecem aqui assim que a
              equipe lançar cuidados, medicamentos ou sinais vitais.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {atividade.map((registro) => (
                <li key={registro.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-strong" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{registro.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {rotuloTipo(registro.tipo)} · {registro.residente} ·{" "}
                      {dataHora(registro.quando)}
                      {registro.autor ? ` · ${registro.autor}` : ""}
                    </p>
                    {registro.atrasado ? (
                      <p className="mt-1 text-xs font-medium text-warning">
                        Sincronizado com atraso (mais de 10 minutos)
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Bloco>

        <Bloco titulo="Solicitações pendentes">
          {solicitacoesPendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma família esperando resposta agora.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {solicitacoesPendentes.slice(0, 5).map((solicitacao) => (
                <li key={solicitacao.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{solicitacao.casa}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Pedido de entrada em {dataHora(solicitacao.quando)}
                    </p>
                  </div>
                  <Link
                    href={`/gerente/casas/${solicitacao.casaId}`}
                    className="shrink-0 text-xs font-medium text-brand-strong hover:underline"
                  >
                    Abrir casa
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {solicitacoesPendentes.length === 0 ? null : (
            <p className="mt-4 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
              Responder a solicitação cria o vínculo da família com o residente — isso entra
              junto com o gerenciamento de residentes.
            </p>
          )}
        </Bloco>
      </div>
    </div>
  );
}
