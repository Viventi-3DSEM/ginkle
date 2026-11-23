"use client";

import { useMemo, useState } from "react";
import { Building2, CalendarClock, Clock, Info } from "lucide-react";
import type { EscalaDoFuncionario, ItemEscala, TurnoEscala } from "@/lib/funcionario/dados";
import { rotuloCargo, rotuloDia } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

const ROTULO_TURNO: Record<TurnoEscala, { nome: string; badge: string }> = {
  MANHA: { nome: "Manhã", badge: "bg-secondary text-brand-strong" },
  TARDE: { nome: "Tarde", badge: "bg-info/15 text-info" },
  NOITE: { nome: "Noite", badge: "bg-warning/15 text-warning" },
  PLANTAO_12H: { nome: "Plantão 12h", badge: "bg-brand-soft text-brand-strong" },
  INTEGRAL: { nome: "Integral", badge: "bg-muted text-foreground" },
};

export default function MinhaEscala({
  dados,
  diaHoje,
}: {
  dados: EscalaDoFuncionario;
  diaHoje: string;
}) {
  const [escopo, setEscopo] = useState<"MINHA" | "EQUIPE">("MINHA");
  const [filtroCasa, setFiltroCasa] = useState("TODAS");

  const visiveis = useMemo(() => {
    return dados.turnos.filter((t) => {
      if (escopo === "MINHA" && !t.ehMeu) return false;
      if (filtroCasa !== "TODAS" && t.casaId !== filtroCasa) return false;
      return true;
    });
  }, [dados.turnos, escopo, filtroCasa]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, ItemEscala[]>();
    for (const item of visiveis) {
      const lista = mapa.get(item.data);
      if (lista) lista.push(item);
      else mapa.set(item.data, [item]);
    }
    return [...mapa.entries()];
  }, [visiveis]);

  const meusCount = useMemo(() => dados.turnos.filter((t) => t.ehMeu).length, [dados.turnos]);

  if (!dados.disponivel) {
    return (
      <section className="rounded-sm border border-warning/40 bg-warning/10 p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Escala ainda não ativada no banco de dados
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              A tabela de escalas de plantão será liberada assim que a migration{" "}
              <code className="rounded bg-card px-1.5 py-0.5 text-xs text-foreground">
                0015_escala_chat.sql
              </code>{" "}
              for aplicada no Supabase. Depois disso, os turnos cadastrados pelo gestor aparecerão
              automaticamente aqui.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar escala">
          <button
            type="button"
            aria-pressed={escopo === "MINHA"}
            onClick={() => setEscopo("MINHA")}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              escopo === "MINHA"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            Meus turnos
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                escopo === "MINHA"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {meusCount}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={escopo === "EQUIPE"}
            onClick={() => setEscopo("EQUIPE")}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              escopo === "EQUIPE"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            Escala da equipe
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                escopo === "EQUIPE"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {dados.turnos.length}
            </span>
          </button>
        </div>

        {dados.casas.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar escala por casa">
            <button
              type="button"
              aria-pressed={filtroCasa === "TODAS"}
              onClick={() => setFiltroCasa("TODAS")}
              className={cn(
                "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                filtroCasa === "TODAS"
                  ? "bg-secondary text-brand-strong"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary/60",
              )}
            >
              Todas as casas
            </button>
            {dados.casas.map((casa) => (
              <button
                key={casa.casaId}
                type="button"
                aria-pressed={filtroCasa === casa.casaId}
                onClick={() => setFiltroCasa(casa.casaId)}
                className={cn(
                  "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  filtroCasa === casa.casaId
                    ? "bg-secondary text-brand-strong"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {casa.casaNome}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {grupos.length === 0 ? (
        <section className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <CalendarClock className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-base font-semibold">
            {escopo === "MINHA"
              ? "Nenhum turno agendado para você"
              : "Nenhum turno publicado pela gestão"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que o gestor publicar os plantões na aba Equipe, sua escala aparecerá aqui.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {grupos.map(([dia, itens]) => {
            const ehHoje = dia === diaHoje;
            const passado = dia < diaHoje;
            return (
              <section key={dia} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <h2
                    className={cn(
                      "font-serif text-sm italic",
                      ehHoje ? "font-semibold text-brand-strong" : "text-muted-foreground",
                    )}
                  >
                    {rotuloDia(dia, diaHoje)}
                  </h2>
                  {passado ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                      Encerrado
                    </span>
                  ) : null}
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {itens.map((t) => {
                    const infoTurno = ROTULO_TURNO[t.turno] ?? {
                      nome: t.turno,
                      badge: "bg-muted text-foreground",
                    };
                    return (
                      <li
                        key={t.id}
                        className={cn(
                          "rounded-sm border bg-card p-4",
                          ehHoje && t.ehMeu ? "border-brand-strong" : "border-border",
                          passado && "opacity-75",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                              infoTurno.badge,
                            )}
                          >
                            {infoTurno.nome}
                          </span>
                          <span className="inline-flex items-center gap-1 font-heading text-sm font-semibold text-foreground">
                            <Clock className="size-3.5 text-brand-strong" aria-hidden="true" />
                            {t.horaInicio} – {t.horaFim}
                          </span>
                        </div>

                        <p className="mt-2.5 text-sm font-semibold text-foreground">
                          {t.ehMeu ? `${t.profissionalNome} (você)` : t.profissionalNome}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            · {rotuloCargo(t.profissionalCargo)}
                          </span>
                        </p>

                        {dados.casas.length > 1 ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
                            {t.casaNome}
                          </p>
                        ) : null}

                        {t.observacoes ? (
                          <p className="mt-2 border-t border-border/70 pt-2 text-xs leading-relaxed text-muted-foreground">
                            {t.observacoes}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
