import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  ClipboardPlus,
  Clock,
  Pill,
  ShieldAlert,
} from "lucide-react";
import BannerFilaOffline from "@/components/funcionario/BannerFilaOffline";
import { painelDoTurno, usuarioDoFuncionario } from "@/lib/funcionario/dados";
import { dataHora, horaCurta, idade, iniciais, rotuloTipo } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Painel do turno" };

const ATALHOS_RAPIDOS = [
  {
    tipo: "CUIDADO",
    titulo: "Cuidado",
    detalhe: "Banho, alimentação, higiene",
    Icone: ClipboardCheck,
  },
  {
    tipo: "MEDICAMENTO",
    titulo: "Medicamento",
    detalhe: "Dose, via e horário",
    Icone: Pill,
  },
  {
    tipo: "SINAL_VITAL",
    titulo: "Sinal vital",
    detalhe: "PA, FC, temp., SpO₂, glicemia",
    Icone: Activity,
  },
  {
    tipo: "OCORRENCIA",
    titulo: "Ocorrência",
    detalhe: "Intercorrência ou conduta",
    Icone: AlertTriangle,
  },
] as const;

function saudacaoBrasilia(): string {
  const horaStr = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const hora = Number(horaStr);
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function Numero({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: number;
  detalhe?: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {rotulo}
      </p>
      <p className="mt-2.5 font-heading text-3xl font-semibold leading-none">{valor}</p>
      {detalhe ? <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

export default async function DashboardTurnoPage() {
  const [usuario, dados] = await Promise.all([usuarioDoFuncionario(), painelDoTurno()]);
  const primeiroNome = usuario?.nome.split(/\s+/)[0] ?? "Equipe";
  const nomesCasas = dados.casas.map((c) => c.casaNome).join(" · ");

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-sm italic text-muted-foreground">{saudacaoBrasilia()},</p>
          <h1 className="mt-0.5 font-heading text-2xl font-semibold sm:text-3xl">
            {primeiroNome}
          </h1>
          {nomesCasas ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
              <span className="truncate">{nomesCasas}</span>
            </p>
          ) : null}
        </div>

        <Link
          href="/funcionario/novo-registro"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ClipboardPlus className="size-4" aria-hidden="true" />
          Novo registro
        </Link>
      </header>

      <BannerFilaOffline />

      <section aria-label="Resumo do turno" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          rotulo="Residentes ativos"
          valor={dados.resumo.residentesAtivos}
          detalhe={
            dados.casas.length === 1
              ? "Sob cuidados na instituição"
              : `Em ${dados.casas.length} casas vinculadas`
          }
        />
        <Numero
          rotulo="Registros hoje"
          valor={dados.resumo.registrosHoje}
          detalhe={
            dados.resumo.meusRegistrosHoje === 1
              ? "1 lançado por você"
              : `${dados.resumo.meusRegistrosHoje} lançados por você`
          }
        />
        <Numero
          rotulo="Ocorrências (24h)"
          valor={dados.resumo.ocorrencias24h}
          detalhe="Atenção nas últimas 24 horas"
        />
        <Numero
          rotulo="Registros (7 dias)"
          valor={dados.resumo.registros7d}
          detalhe="Cuidados na última semana"
        />
      </section>

      <section aria-label="Atalhos de registro" className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Registrar agora</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ATALHOS_RAPIDOS.map((item) => (
            <Link
              key={item.tipo}
              href={`/funcionario/novo-registro?tipo=${item.tipo}`}
              className="group flex flex-col justify-between rounded-sm border border-border bg-card p-4 transition-colors hover:border-brand-strong hover:bg-secondary/40"
            >
              <item.Icone className="size-5 text-brand-strong" aria-hidden="true" />
              <div className="mt-3">
                <p className="font-heading text-sm font-semibold text-foreground">
                  {item.titulo}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.detalhe}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">Residentes do turno</h2>
            <Link
              href="/funcionario/residentes"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong hover:underline"
            >
              Ver todos
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          {dados.residentesRapidos.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum residente ativo encontrado nas casas vinculadas ao seu perfil.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {dados.residentesRapidos.map((r) => {
                const anos = idade(r.nascimento);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/funcionario/residentes/${r.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 group"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-xs font-bold text-brand-strong"
                      >
                        {iniciais(r.nome)}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-brand-strong">
                          <span className="truncate">{r.nome}</span>
                          {r.observacoesMedicas ? (
                            <ShieldAlert
                              className="size-3.5 shrink-0 text-warning"
                              aria-label="Possui observações médicas"
                            />
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {anos !== null ? `${anos} anos` : "Residente"}
                          {dados.casas.length > 1 ? ` · ${r.casaNome}` : ""}
                          {r.registrosHoje > 0
                            ? ` · ${r.registrosHoje} ${r.registrosHoje === 1 ? "registro" : "registros"} hoje`
                            : " · sem registro hoje"}
                        </span>
                      </span>
                    </Link>

                    <Link
                      href={`/funcionario/novo-registro?residente=${r.id}`}
                      aria-label={`Registrar cuidado para ${r.nome}`}
                      className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <ClipboardPlus className="size-3.5 text-brand-strong" aria-hidden="true" />
                      Registrar
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">Atividade recente</h2>
            <Link
              href="/funcionario/historico"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong hover:underline"
            >
              Histórico completo
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          {dados.atividadeRecente.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum registro assistencial lançado ainda. Use o botão &ldquo;Novo registro&rdquo;
              para iniciar o acompanhamento do turno.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {dados.atividadeRecente.slice(0, 8).map((item) => (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/funcionario/residentes/${item.residenteId}`}
                      className="truncate text-sm font-semibold text-foreground transition-colors hover:text-brand-strong"
                    >
                      {item.residenteNome}
                    </Link>
                    <time
                      dateTime={item.criadoEm}
                      className="shrink-0 text-xs text-muted-foreground"
                      title={dataHora(item.criadoEm)}
                    >
                      {horaCurta(item.criadoEm)}
                    </time>
                  </div>

                  <p className="mt-0.5 text-xs font-medium text-foreground">
                    <span className="text-brand-strong">{rotuloTipo(item.tipo)}</span> ·{" "}
                    {item.titulo}
                  </p>

                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{item.ehMeu ? `${item.autorNome} (você)` : item.autorNome}</span>
                    {item.atrasado ? (
                      <span className="inline-flex items-center gap-1 font-medium text-warning">
                        <Clock className="size-3" aria-hidden="true" />
                        Sincronização atrasada
                      </span>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
