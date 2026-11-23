import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Info, Mail, Phone, Wallet } from "lucide-react";
import { financeiroDoFamiliar } from "@/lib/portal/dados";
import { dataCurta, reais } from "@/lib/painel/formato";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Financeiro" };

const STATUS_ASSINATURA: Record<string, { rotulo: string; classe: string }> = {
  ATIVA: { rotulo: "Ativa", classe: "bg-secondary text-brand-strong" },
  SUSPENSA: { rotulo: "Suspensa", classe: "bg-warning/15 text-warning" },
  CANCELADA: { rotulo: "Cancelada", classe: "bg-muted text-muted-foreground" },
};

const STATUS_FATURA: Record<string, { rotulo: string; classe: string }> = {
  PAGO: { rotulo: "Pago", classe: "bg-success/15 text-success" },
  PENDENTE: { rotulo: "Pendente", classe: "bg-info/15 text-info" },
  ATRASADO: { rotulo: "Atrasado", classe: "bg-danger/15 text-danger" },
  CANCELADO: { rotulo: "Cancelado", classe: "bg-muted text-muted-foreground" },
};

export default async function FinanceiroFamiliarPage() {
  const { assinaturas, resumo } = await financeiroDoFamiliar();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulte seu plano contratado, vigência e histórico de faturas registradas pela
          instituição.
        </p>
      </header>

      <div className="flex items-start gap-2.5 rounded-sm border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        <p>
          Painel informativo de transparência: pagamentos, recibos e negociações acontecem
          diretamente com a instituição, que atualiza a situação de cada fatura aqui.
        </p>
      </div>

      {assinaturas.length === 0 ? (
        <section className="rounded-sm border border-border bg-card p-8 text-center">
          <Wallet className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-lg font-semibold">
            Nenhuma assinatura vinculada ainda
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Quando a instituição registrar seu plano e suas mensalidades no Ginkle, todo o
            histórico financeiro aparecerá aqui.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/cliente/residentes"
              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Ver residentes
            </Link>
            <Link
              href="/cliente/chat"
              className="inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Falar com a casa
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section aria-label="Resumo financeiro" className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Mensalidade ativa
              </p>
              <p className="mt-2.5 font-heading text-2xl font-semibold leading-none">
                {resumo.assinaturasAtivas > 0 ? `R$ ${reais(resumo.mensalidadeAtiva)}` : "—"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {resumo.assinaturasAtivas === 1
                  ? "1 assinatura ativa"
                  : `${resumo.assinaturasAtivas} assinaturas ativas`}
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Em aberto
              </p>
              <p className="mt-2.5 font-heading text-2xl font-semibold leading-none">
                R$ {reais(resumo.valorEmAberto)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {resumo.faturasEmAberto === 1
                  ? "1 fatura pendente ou atrasada"
                  : `${resumo.faturasEmAberto} faturas pendentes ou atrasadas`}
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Faturas pagas
              </p>
              <p className="mt-2.5 font-heading text-2xl font-semibold leading-none">
                {resumo.faturasPagas}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Quitações confirmadas pela casa</p>
            </div>
          </section>

          <div className="space-y-6">
            {assinaturas.map((a) => {
              const stAss = STATUS_ASSINATURA[a.status] ?? {
                rotulo: a.status,
                classe: "bg-muted text-muted-foreground",
              };

              return (
                <section
                  key={a.id}
                  className="rounded-sm border border-border bg-card p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                          {a.planoNome}
                        </h2>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                            stAss.classe,
                          )}
                        >
                          {stAss.rotulo}
                        </span>
                      </div>

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
                        <span>
                          {a.casaNome}
                          {a.casaCidade ? ` · ${a.casaCidade}, ${a.casaUf}` : ""}
                        </span>
                      </p>

                      {a.planoDescricao ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {a.planoDescricao}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-heading text-2xl font-semibold text-foreground">
                        R$ {reais(a.planoValor)}
                        <span className="font-sans text-xs font-normal text-muted-foreground">
                          /mês
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Início em {dataCurta(a.inicio)}
                        {a.fim ? ` · fim em ${dataCurta(a.fim)}` : ""}
                      </p>
                    </div>
                  </div>

                  {a.casaTelefone || a.casaEmail ? (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Dúvidas sobre cobranças:</span>
                      {a.casaTelefone ? (
                        <a
                          href={`tel:${a.casaTelefone}`}
                          className="inline-flex items-center gap-1 font-medium text-brand-strong hover:underline"
                        >
                          <Phone className="size-3.5" aria-hidden="true" />
                          {formatarTelefone(a.casaTelefone)}
                        </a>
                      ) : null}
                      {a.casaEmail ? (
                        <a
                          href={`mailto:${a.casaEmail}`}
                          className="inline-flex items-center gap-1 break-all hover:text-foreground"
                        >
                          <Mail className="size-3.5" aria-hidden="true" />
                          {a.casaEmail}
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Histórico de faturas ({a.faturas.length})
                    </h3>

                    {a.faturas.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Nenhuma fatura lançada ainda para esta assinatura.
                      </p>
                    ) : (
                      <ul className="mt-3 divide-y divide-border rounded-sm border border-border">
                        {a.faturas.map((f) => {
                          const stFat = STATUS_FATURA[f.status] ?? {
                            rotulo: f.status,
                            classe: "bg-muted text-muted-foreground",
                          };
                          return (
                            <li
                              key={f.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                            >
                              <div>
                                <p className="font-medium text-foreground">
                                  Vencimento {dataCurta(f.vencimento)}
                                </p>
                                {f.pagamento ? (
                                  <p className="text-xs text-muted-foreground">
                                    Pago em {dataCurta(f.pagamento)}
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-heading text-base font-semibold text-foreground">
                                  R$ {reais(f.valor)}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                                    stFat.classe,
                                  )}
                                >
                                  {stFat.rotulo}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
