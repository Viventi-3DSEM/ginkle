"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  Pill,
  type LucideIcon,
} from "lucide-react";
import type { RegistroTimeline } from "@/lib/portal/dados";
import {
  atrasoMinutos,
  chaveDia,
  dataHora,
  horaCurta,
  rotuloCargo,
  rotuloDia,
  rotuloTipo,
} from "@/lib/portal/formato";
import { cn } from "@/lib/utils";

type FiltroTipo = "TODOS" | "CUIDADO" | "MEDICAMENTO" | "SINAL_VITAL" | "OCORRENCIA";

const FILTROS: { valor: FiltroTipo; rotulo: string }[] = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "CUIDADO", rotulo: "Cuidados" },
  { valor: "MEDICAMENTO", rotulo: "Medicamentos" },
  { valor: "SINAL_VITAL", rotulo: "Sinais vitais" },
  { valor: "OCORRENCIA", rotulo: "Ocorrências" },
];

const ESTILO_TIPO: Record<string, { ponto: string; selo: string; Icone: LucideIcon }> = {
  CUIDADO: {
    ponto: "bg-brand-strong",
    selo: "bg-secondary text-brand-strong",
    Icone: ClipboardCheck,
  },
  MEDICAMENTO: {
    ponto: "bg-info",
    selo: "bg-info/15 text-info",
    Icone: Pill,
  },
  SINAL_VITAL: {
    ponto: "bg-success",
    selo: "bg-success/15 text-success",
    Icone: Activity,
  },
  OCORRENCIA: {
    ponto: "bg-warning",
    selo: "bg-warning/15 text-warning",
    Icone: AlertTriangle,
  },
};

type Props = {
  registros: RegistroTimeline[];
  diaHoje: string;
};

export default function TimelineResidente({ registros, diaHoje }: Props) {
  const [filtro, setFiltro] = useState<FiltroTipo>("TODOS");

  if (registros.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum cuidado registrado ainda para este residente. Os registros aparecem aqui
        assim que a equipe da instituição lançar cuidados, medicamentos, sinais vitais ou
        ocorrências.
      </p>
    );
  }

  const contagemPorTipo = new Map<string, number>();
  for (const r of registros) {
    contagemPorTipo.set(r.tipo, (contagemPorTipo.get(r.tipo) ?? 0) + 1);
  }

  const visiveis =
    filtro === "TODOS" ? registros : registros.filter((r) => r.tipo === filtro);

  const grupos = new Map<string, RegistroTimeline[]>();
  for (const item of visiveis) {
    const dia = chaveDia(item.criadoEm);
    const lista = grupos.get(dia);
    if (lista) lista.push(item);
    else grupos.set(dia, [item]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar linha do tempo por tipo">
        {FILTROS.map((opcao) => {
          const total =
            opcao.valor === "TODOS"
              ? registros.length
              : (contagemPorTipo.get(opcao.valor) ?? 0);
          const ativo = filtro === opcao.valor;

          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => setFiltro(opcao.valor)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                ativo
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>{opcao.rotulo}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                  ativo ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted",
                )}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        {visiveis.length === 1
          ? "Mostrando 1 registro."
          : `Mostrando ${visiveis.length} registros.`}
      </p>

      {visiveis.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum registro do tipo {rotuloTipo(filtro).toLowerCase()} encontrado.
          </p>
          <button
            type="button"
            onClick={() => setFiltro("TODOS")}
            className="mt-3 rounded-sm border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary"
          >
            Mostrar todos os registros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {[...grupos.entries()].map(([dia, itens]) => (
            <div key={dia} className="space-y-3">
              <h3 className="font-serif text-sm italic text-muted-foreground">
                {rotuloDia(dia, diaHoje)}
              </h3>

              <ol className="relative space-y-4 border-l border-border pl-5">
                {itens.map((item) => {
                  const estilo = ESTILO_TIPO[item.tipo] ?? ESTILO_TIPO.CUIDADO;
                  const Icone = estilo.Icone;
                  const atraso = item.atrasado
                    ? atrasoMinutos(item.criadoEm, item.sincronizadoEm)
                    : 0;

                  return (
                    <li
                      key={item.id}
                      className="relative rounded-sm border border-border bg-background/60 p-4"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -left-[25px] top-5 size-2.5 rounded-full ring-4 ring-card",
                          estilo.ponto,
                        )}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                            estilo.selo,
                          )}
                        >
                          <Icone className="size-3" aria-hidden="true" />
                          {rotuloTipo(item.tipo)}
                        </span>

                        <time
                          dateTime={item.criadoEm}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {horaCurta(item.criadoEm)}
                        </time>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-foreground">{item.titulo}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.descricao}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
                        <span>
                          Registrado por{" "}
                          <span className="font-medium text-foreground">{item.autorNome}</span>
                          {item.autorCargo ? ` (${rotuloCargo(item.autorCargo)})` : ""}
                        </span>

                        <span>
                          Sincronizado em{" "}
                          <time dateTime={item.sincronizadoEm}>
                            {dataHora(item.sincronizadoEm)}
                          </time>
                        </span>
                      </div>

                      {item.atrasado ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                          Sincronizado com atraso
                          {atraso > 0 ? ` (${atraso} min após o registro no dispositivo)` : " (mais de 10 minutos)"}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
