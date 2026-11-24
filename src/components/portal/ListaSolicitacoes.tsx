"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cancelarAdesao, type EstadoAcao } from "@/lib/portal/actions";
import type { AdesaoDoFamiliar } from "@/lib/portal/dados";
import { dataHora, rotuloStatusAdesao } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

type FiltroStatus = "TODAS" | "PENDENTE" | "APROVADA" | "RECUSADA" | "CANCELADA";

const FILTROS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: "TODAS", rotulo: "Todas" },
  { valor: "PENDENTE", rotulo: "Pendentes" },
  { valor: "APROVADA", rotulo: "Aprovadas" },
  { valor: "RECUSADA", rotulo: "Recusadas" },
  { valor: "CANCELADA", rotulo: "Canceladas" },
];

const ESTILO_STATUS: Record<
  string,
  { selo: string; Icone: LucideIcon; descricao: string }
> = {
  PENDENTE: {
    selo: "bg-brand-soft text-brand-strong",
    Icone: Clock,
    descricao: "Aguardando retorno da equipe da instituição.",
  },
  APROVADA: {
    selo: "bg-success/15 text-success",
    Icone: CheckCircle2,
    descricao:
      "Pedido aceito pela instituição. O residente aparece na aba Residentes assim que o vínculo for concluído.",
  },
  RECUSADA: {
    selo: "bg-danger/15 text-danger",
    Icone: XCircle,
    descricao: "Solicitação recusada pela casa. Você pode enviar um novo pedido se precisar.",
  },
  CANCELADA: {
    selo: "bg-muted text-muted-foreground",
    Icone: Ban,
    descricao: "Cancelada por você. Você pode solicitar entrada novamente quando quiser.",
  },
};

type Props = {
  adesoes: AdesaoDoFamiliar[];
};

export default function ListaSolicitacoes({ adesoes }: Props) {
  const [filtro, setFiltro] = useState<FiltroStatus>("TODAS");
  const [alvoCancelar, setAlvoCancelar] = useState<AdesaoDoFamiliar | null>(null);
  const [avisoOk, setAvisoOk] = useState("");
  const [erroDialogo, setErroDialogo] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const manterBtnRef = useRef<HTMLButtonElement>(null);

  const tituloDialogId = useId();
  const descDialogId = useId();

  const [, acaoCancelar, cancelando] = useActionState<EstadoAcao, FormData>(
    async (prev, formData) => {
      const res = await cancelarAdesao(prev, formData);
      if (res.ok) {
        setAvisoOk(res.ok);
        setErroDialogo("");
        dialogRef.current?.close("confirmed");
      } else if (res.erro) {
        setErroDialogo(res.erro);
      }
      return res;
    },
    {},
  );

  const cancelandoRef = useRef(cancelando);
  useEffect(() => {
    cancelandoRef.current = cancelando;
    const dialog = dialogRef.current;
    if (dialog) dialog.setAttribute("closedby", cancelando ? "none" : "any");
  }, [cancelando]);

  // closedby="any" dá light-dismiss nativo; onde o navegador ainda não suporta
  // (ex.: Safari), aplicamos o fallback por coordenadas fora do retângulo.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.setAttribute("closedby", "any");

    if ("closedBy" in HTMLDialogElement.prototype) return;

    const fora = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    let pressionouFora = false;
    const onPointerDown = (e: PointerEvent) => {
      pressionouFora = fora(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!cancelandoRef.current && pressionouFora && fora(e)) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  function abrirConfirmacao(adesao: AdesaoDoFamiliar) {
    setErroDialogo("");
    setAvisoOk("");
    setAlvoCancelar(adesao);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      manterBtnRef.current?.focus();
    }
  }

  function fecharDialogo() {
    dialogRef.current?.close("cancel");
  }

  const contagemPorStatus = new Map<string, number>();
  for (const item of adesoes) {
    contagemPorStatus.set(item.status, (contagemPorStatus.get(item.status) ?? 0) + 1);
  }

  const visiveis =
    filtro === "TODAS" ? adesoes : adesoes.filter((item) => item.status === filtro);

  return (
    <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Histórico de solicitações</h2>
      </div>

      {avisoOk ? (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <span>{avisoOk}</span>
        </p>
      ) : null}

      {adesoes.length === 0 ? (
        <div className="mt-5 rounded-sm border border-dashed border-border p-8 text-center">
          <Building2 className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-heading text-base font-semibold">
            Nenhuma solicitação enviada ainda
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Use o formulário acima para escolher uma instituição publicada no diretório e pedir
            entrada.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar solicitações por situação"
          >
            {FILTROS.map((opcao) => {
              const total =
                opcao.valor === "TODAS"
                  ? adesoes.length
                  : (contagemPorStatus.get(opcao.valor) ?? 0);
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
              ? "Mostrando 1 solicitação."
              : `Mostrando ${visiveis.length} solicitações.`}
          </p>

          {visiveis.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma solicitação com situação{" "}
                {rotuloStatusAdesao(filtro).toLowerCase()}.
              </p>
              <button
                type="button"
                onClick={() => setFiltro("TODAS")}
                className="mt-3 rounded-sm border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary"
              >
                Mostrar todas as solicitações
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {visiveis.map((adesao) => {
                const estilo = ESTILO_STATUS[adesao.status] ?? ESTILO_STATUS.PENDENTE;
                const Icone = estilo.Icone;
                const localizacao =
                  adesao.casaBairro && adesao.casaCidade
                    ? `${adesao.casaBairro}, ${adesao.casaCidade}${adesao.casaUf ? ` · ${adesao.casaUf}` : ""}`
                    : null;

                return (
                  <li
                    key={adesao.id}
                    className="rounded-sm border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      {adesao.casaCapaUrl ? (
                        <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-sm bg-secondary sm:block">
                          <Image
                            src={adesao.casaCapaUrl}
                            alt=""
                            fill
                            sizes="112px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          aria-hidden="true"
                          className="hidden h-20 w-28 shrink-0 place-items-center rounded-sm bg-secondary text-muted-foreground sm:grid"
                        >
                          <Building2 className="size-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            {adesao.casaSlug && adesao.casaPublicada ? (
                              <Link
                                href={`/casas/${adesao.casaSlug}`}
                                className="truncate font-heading text-base font-semibold transition-colors hover:text-brand-strong"
                              >
                                {adesao.casaNome}
                              </Link>
                            ) : (
                              <h3 className="truncate font-heading text-base font-semibold">
                                {adesao.casaNome}
                              </h3>
                            )}

                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                                estilo.selo,
                              )}
                            >
                              <Icone className="size-3" aria-hidden="true" />
                              {rotuloStatusAdesao(adesao.status)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {adesao.casaSlug && adesao.casaPublicada ? (
                              <Link
                                href={`/casas/${adesao.casaSlug}`}
                                target="_blank"
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <ExternalLink className="size-3.5" aria-hidden="true" />
                                Ver casa
                              </Link>
                            ) : null}

                            {adesao.status === "PENDENTE" ? (
                              <button
                                type="button"
                                onClick={() => abrirConfirmacao(adesao)}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:border-danger/60 hover:bg-danger/10"
                              >
                                <X className="size-3.5" aria-hidden="true" />
                                Cancelar solicitação
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {localizacao ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                            <span>{localizacao}</span>
                          </p>
                        ) : !adesao.casaPublicada ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Instituição fora do diretório público no momento.
                          </p>
                        ) : null}

                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {estilo.descricao}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
                          <span>
                            Solicitada em{" "}
                            <time dateTime={adesao.quando} className="font-medium text-foreground">
                              {dataHora(adesao.quando)}
                            </time>
                          </span>
                          {adesao.respondidaEm ? (
                            <span>
                              Respondida em{" "}
                              <time
                                dateTime={adesao.respondidaEm}
                                className="font-medium text-foreground"
                              >
                                {dataHora(adesao.respondidaEm)}
                              </time>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Modal nativo: o navegador cuida do foco, top-layer, backdrop e tecla Esc. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={tituloDialogId}
        aria-describedby={descDialogId}
        onCancel={(e) => {
          if (cancelando) e.preventDefault();
        }}
        onClose={(e) => {
          e.currentTarget.returnValue = "";
          setAlvoCancelar(null);
          setErroDialogo("");
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={tituloDialogId} className="font-heading text-lg font-semibold">
              Cancelar solicitação?
            </h2>
            <button
              type="button"
              onClick={fecharDialogo}
              disabled={cancelando}
              aria-label="Fechar janela"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p id={descDialogId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Você está cancelando o pedido de entrada para{" "}
            <span className="font-semibold text-foreground">
              {alvoCancelar?.casaNome ?? "esta instituição"}
            </span>
            . A equipe não verá mais este pedido como pendente, mas você pode solicitar novamente
            quando quiser.
          </p>

          {erroDialogo ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 border-l-2 border-danger bg-background/60 px-3 py-2.5 text-xs leading-relaxed text-danger"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{erroDialogo}</span>
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={manterBtnRef}
              type="button"
              onClick={fecharDialogo}
              disabled={cancelando}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Manter solicitação
            </button>

            <form action={acaoCancelar}>
              <input type="hidden" name="id" value={alvoCancelar?.id ?? ""} />
              <button
                type="submit"
                disabled={cancelando || !alvoCancelar}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {cancelando ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </section>
  );
}
