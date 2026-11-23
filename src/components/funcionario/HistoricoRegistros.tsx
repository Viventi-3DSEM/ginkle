"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  Pill,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import type { RegistroDoTurno, VinculoOperacional } from "@/lib/funcionario/dados";
import {
  chaveDia,
  dataHora,
  duracaoIntervalo,
  horaCurta,
  rotuloCargo,
  rotuloDia,
  rotuloTipo,
} from "@/lib/painel/formato";
import { cn } from "@/lib/utils";
import BannerFilaOffline from "./BannerFilaOffline";

type FiltroTipo = "TODOS" | "CUIDADO" | "MEDICAMENTO" | "SINAL_VITAL" | "OCORRENCIA";

const FILTROS_TIPO: { valor: FiltroTipo; rotulo: string }[] = [
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
  casas: VinculoOperacional[];
  registros: RegistroDoTurno[];
  diaHoje: string;
  limitado: boolean;
};

export default function HistoricoRegistros({ casas, registros, diaHoje, limitado }: Props) {
  const buscaId = useId();
  const [filtroCasa, setFiltroCasa] = useState("TODAS");
  const [filtroAutor, setFiltroAutor] = useState<"TODOS" | "MEUS">("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return registros.filter((r) => {
      if (filtroCasa !== "TODAS" && r.casaId !== filtroCasa) return false;
      if (filtroAutor === "MEUS" && !r.ehMeu) return false;
      if (filtroTipo !== "TODOS" && r.tipo !== filtroTipo) return false;
      if (
        termo &&
        !r.residenteNome.toLowerCase().includes(termo) &&
        !r.titulo.toLowerCase().includes(termo) &&
        !r.descricao.toLowerCase().includes(termo) &&
        !r.autorNome.toLowerCase().includes(termo)
      ) {
        return false;
      }
      return true;
    });
  }, [registros, filtroCasa, filtroAutor, filtroTipo, busca]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, RegistroDoTurno[]>();
    for (const item of visiveis) {
      const dia = chaveDia(item.criadoEm);
      const lista = mapa.get(dia);
      if (lista) lista.push(item);
      else mapa.set(dia, [item]);
    }
    return [...mapa.entries()];
  }, [visiveis]);

  const totalMeus = useMemo(() => registros.filter((r) => r.ehMeu).length, [registros]);

  return (
    <div className="space-y-6">
      <BannerFilaOffline />

      <search className="space-y-4 rounded-sm border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor={buscaId}
              className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Buscar no histórico
            </label>
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id={buscaId}
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Residente, cuidado, medicamento ou autor..."
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full border-b border-input bg-transparent py-2 pl-6 pr-8 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand-strong sm:text-sm"
              />
              {busca ? (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por autoria">
            <button
              type="button"
              aria-pressed={filtroAutor === "TODOS"}
              onClick={() => setFiltroAutor("TODOS")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                filtroAutor === "TODOS"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary",
              )}
            >
              Toda a equipe
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                  filtroAutor === "TODOS"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {registros.length}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={filtroAutor === "MEUS"}
              onClick={() => setFiltroAutor("MEUS")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                filtroAutor === "MEUS"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary",
              )}
            >
              Meus registros
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                  filtroAutor === "MEUS"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {totalMeus}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
          {FILTROS_TIPO.map((op) => (
            <button
              key={op.valor}
              type="button"
              aria-pressed={filtroTipo === op.valor}
              onClick={() => setFiltroTipo(op.valor)}
              className={cn(
                "min-h-8 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                filtroTipo === op.valor
                  ? "bg-secondary text-brand-strong"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {op.rotulo}
            </button>
          ))}
        </div>

        {casas.length > 1 ? (
          <div
            className="flex flex-wrap gap-2 border-t border-border pt-3"
            role="group"
            aria-label="Filtrar por casa"
          >
            <button
              type="button"
              aria-pressed={filtroCasa === "TODAS"}
              onClick={() => setFiltroCasa("TODAS")}
              className={cn(
                "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                filtroCasa === "TODAS"
                  ? "bg-secondary text-brand-strong"
                  : "border border-border text-muted-foreground hover:bg-secondary/60",
              )}
            >
              Todas as casas
            </button>
            {casas.map((casa) => (
              <button
                key={casa.casaId}
                type="button"
                aria-pressed={filtroCasa === casa.casaId}
                onClick={() => setFiltroCasa(casa.casaId)}
                className={cn(
                  "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  filtroCasa === casa.casaId
                    ? "bg-secondary text-brand-strong"
                    : "border border-border text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {casa.casaNome}
              </button>
            ))}
          </div>
        ) : null}
      </search>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p aria-live="polite">
          {visiveis.length === 1
            ? "Mostrando 1 registro."
            : `Mostrando ${visiveis.length} registros.`}
        </p>
        {limitado ? <p>Exibindo os 200 registros mais recentes.</p> : null}
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum registro encontrado para os filtros selecionados.
          </p>
          {busca || filtroAutor !== "TODOS" || filtroTipo !== "TODOS" || filtroCasa !== "TODAS" ? (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltroAutor("TODOS");
                setFiltroTipo("TODOS");
                setFiltroCasa("TODAS");
              }}
              className="mt-3 rounded-sm border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(([dia, itens]) => (
            <section key={dia} className="space-y-3">
              <h2 className="font-serif text-sm italic text-muted-foreground">
                {rotuloDia(dia, diaHoje)}
              </h2>

              <ol className="relative space-y-3.5 border-l border-border pl-5">
                {itens.map((item) => {
                  const estilo = ESTILO_TIPO[item.tipo] ?? ESTILO_TIPO.CUIDADO;
                  const Icone = estilo.Icone;
                  const intervalo = item.atrasado
                    ? duracaoIntervalo(item.criadoEm, item.sincronizadoEm)
                    : null;

                  return (
                    <li
                      key={item.id}
                      className="relative rounded-sm border border-border bg-card p-4"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -left-[25px] top-5 size-2.5 rounded-full ring-4 ring-background",
                          estilo.ponto,
                        )}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                              estilo.selo,
                            )}
                          >
                            <Icone className="size-3" aria-hidden="true" />
                            {rotuloTipo(item.tipo)}
                          </span>

                          <Link
                            href={`/funcionario/residentes/${item.residenteId}`}
                            className="text-xs font-semibold text-foreground transition-colors hover:text-brand-strong"
                          >
                            {item.residenteNome}
                          </Link>

                          {casas.length > 1 ? (
                            <span className="text-xs text-muted-foreground">· {item.casaNome}</span>
                          ) : null}
                        </div>

                        <time
                          dateTime={item.criadoEm}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {horaCurta(item.criadoEm)}
                        </time>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-foreground">{item.titulo}</p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {item.descricao}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
                        <span>
                          Registrado por{" "}
                          <span className="font-medium text-foreground">
                            {item.ehMeu ? `${item.autorNome} (você)` : item.autorNome}
                          </span>
                          {item.autorCargo ? ` · ${rotuloCargo(item.autorCargo)}` : ""}
                        </span>

                        <span>
                          Sincronizado em{" "}
                          <time dateTime={item.sincronizadoEm}>
                            {dataHora(item.sincronizadoEm)}
                          </time>
                        </span>
                      </div>

                      {item.atrasado && intervalo ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                          Sincronizado com diferença de {intervalo.rotulo} após o horário do
                          dispositivo
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
