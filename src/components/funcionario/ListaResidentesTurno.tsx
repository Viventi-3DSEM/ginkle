"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardPlus,
  Clock,
  Phone,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ResidenteOperacional, VinculoOperacional } from "@/lib/funcionario/dados";
import {
  dataHora,
  idade,
  iniciais,
  rotuloSexo,
  rotuloStatusResidente,
  rotuloTipo,
} from "@/lib/painel/formato";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { cn } from "@/lib/utils";

type Props = {
  casas: VinculoOperacional[];
  residentes: ResidenteOperacional[];
};

export default function ListaResidentesTurno({ casas, residentes }: Props) {
  const buscaId = useId();
  const [filtroCasa, setFiltroCasa] = useState("TODAS");
  const [filtroStatus, setFiltroStatus] = useState<"ATIVOS" | "TODOS">("ATIVOS");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return residentes.filter((r) => {
      if (filtroCasa !== "TODAS" && r.casaId !== filtroCasa) return false;
      if (filtroStatus === "ATIVOS" && r.status !== "ATIVO") return false;
      if (
        termo &&
        !r.nome.toLowerCase().includes(termo) &&
        !(r.observacoesMedicas ?? "").toLowerCase().includes(termo)
      ) {
        return false;
      }
      return true;
    });
  }, [residentes, filtroCasa, filtroStatus, busca]);

  const totalAtivos = useMemo(
    () => residentes.filter((r) => r.status === "ATIVO").length,
    [residentes],
  );

  return (
    <div className="space-y-5">
      <search className="space-y-3 rounded-sm border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor={buscaId}
              className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Buscar residente
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
                placeholder="Nome ou observação médica..."
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

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
            <button
              type="button"
              aria-pressed={filtroStatus === "ATIVOS"}
              onClick={() => setFiltroStatus("ATIVOS")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                filtroStatus === "ATIVOS"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary",
              )}
            >
              Ativos
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                  filtroStatus === "ATIVOS"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {totalAtivos}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={filtroStatus === "TODOS"}
              onClick={() => setFiltroStatus("TODOS")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                filtroStatus === "TODOS"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary",
              )}
            >
              Todos
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                  filtroStatus === "TODOS"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {residentes.length}
              </span>
            </button>
          </div>
        </div>

        {casas.length > 1 ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3" role="group" aria-label="Filtrar por casa">
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

      <p aria-live="polite" className="text-xs text-muted-foreground">
        {visiveis.length === 1
          ? "1 residente encontrado."
          : `${visiveis.length} residentes encontrados.`}
      </p>

      {visiveis.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum residente encontrado com os filtros atuais.
          </p>
          {busca || filtroCasa !== "TODAS" || filtroStatus !== "TODOS" ? (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltroCasa("TODAS");
                setFiltroStatus("TODOS");
              }}
              className="mt-3 rounded-sm border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visiveis.map((r) => {
            const anos = idade(r.nascimento);
            const contato = r.familiares[0] ?? null;

            return (
              <li
                key={r.id}
                className="flex flex-col justify-between rounded-sm border border-border bg-card p-5"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-sm font-bold text-brand-strong"
                    >
                      {iniciais(r.nome)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-base font-semibold text-foreground">
                          <Link
                            href={`/funcionario/residentes/${r.id}`}
                            className="transition-colors hover:text-brand-strong"
                          >
                            {r.nome}
                          </Link>
                        </h2>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider",
                            r.status === "ATIVO"
                              ? "bg-secondary text-brand-strong"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {rotuloStatusResidente(r.status)}
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {anos !== null ? `${anos} anos` : "Idade não informada"} ·{" "}
                        {rotuloSexo(r.sexo)}
                        {casas.length > 1 ? ` · ${r.casaNome}` : ""}
                      </p>
                    </div>
                  </div>

                  {r.observacoesMedicas ? (
                    <p className="mt-3 flex items-start gap-1.5 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-foreground">
                      <ShieldAlert
                        className="mt-0.5 size-3.5 shrink-0 text-warning"
                        aria-hidden="true"
                      />
                      <span className="line-clamp-2">{r.observacoesMedicas}</span>
                    </p>
                  ) : null}

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                      {r.ultimoRegistroEm ? (
                        <span>
                          Último: <strong className="font-medium text-foreground">{rotuloTipo(r.ultimoRegistroTipo ?? "")}</strong>{" "}
                          ({dataHora(r.ultimoRegistroEm)}) · {r.registrosHoje} hoje
                        </span>
                      ) : (
                        <span>Sem registros nos últimos 7 dias</span>
                      )}
                    </p>

                    {contato ? (
                      <p className="flex flex-wrap items-center gap-1.5">
                        <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {contato.nome} ({contato.parentesco})
                        </span>
                        {contato.telefone ? (
                          <a
                            href={`tel:${contato.telefone}`}
                            className="font-medium text-brand-strong hover:underline"
                          >
                            · {formatarTelefone(contato.telefone)}
                          </a>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5">
                  <Link
                    href={`/funcionario/residentes/${r.id}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Ver ficha
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>

                  {r.status === "ATIVO" ? (
                    <Link
                      href={`/funcionario/novo-registro?residente=${r.id}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <ClipboardPlus className="size-3.5" aria-hidden="true" />
                      Registrar
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
