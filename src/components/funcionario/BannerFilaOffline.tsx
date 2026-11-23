"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CloudOff, RefreshCw, Trash2 } from "lucide-react";
import { dataHora, rotuloTipo } from "@/lib/painel/formato";
import type { RegistroOfflinePendente } from "@/lib/funcionario/offline";
import { cn } from "@/lib/utils";
import { useOffline } from "./OfflineProvider";

type Props = {
  /** Quando informado, exibe apenas pendências deste residente (ou aviso offline). */
  residenteId?: string;
  /** Quando true, oculta o banner se estiver online e sem pendências. */
  apenasQuandoNecessario?: boolean;
};

export default function BannerFilaOffline({
  residenteId,
  apenasQuandoNecessario = true,
}: Props) {
  const { online, pendentes, sincronizando, sincronizarFila, descartarPendente } = useOffline();
  const [alvoDescarte, setAlvoDescarte] = useState<RegistroOfflinePendente | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const tituloId = useId();

  const itens = residenteId
    ? pendentes.filter((p) => p.residenteId === residenteId)
    : pendentes;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.setAttribute("closedby", "any");
  }, []);

  if (apenasQuandoNecessario && online && itens.length === 0) {
    return null;
  }

  function pedirDescarte(item: RegistroOfflinePendente) {
    setAlvoDescarte(item);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarRef.current?.focus();
    }
  }

  async function confirmarDescarte() {
    if (!alvoDescarte) return;
    await descartarPendente(alvoDescarte.idRegistro);
    dialogRef.current?.close();
    setAlvoDescarte(null);
  }

  const temErroPermanente = itens.some((i) => i.permanente || i.status === "ERRO");

  return (
    <>
      <section
        aria-label="Sincronização offline"
        className={cn(
          "rounded-sm border p-4 sm:p-5",
          !online
            ? "border-warning/40 bg-warning/10"
            : temErroPermanente
              ? "border-danger/40 bg-danger/5"
              : "border-info/40 bg-info/10",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {!online ? (
              <CloudOff className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            ) : temErroPermanente ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            ) : (
              <RefreshCw
                className={cn(
                  "mt-0.5 size-4 shrink-0 text-info",
                  sincronizando && "animate-spin",
                )}
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                {!online
                  ? "Modo offline ativo"
                  : itens.length === 1
                    ? "1 registro aguardando sincronização"
                    : `${itens.length} registros aguardando sincronização`}
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {!online
                  ? "Você pode continuar registrando cuidados normalmente. Tudo fica guardado neste aparelho com o horário exato e é enviado assim que a internet voltar."
                  : "Estes registros foram salvos localmente com o horário do dispositivo e serão enviados ao servidor."}
              </p>
            </div>
          </div>

          {online && itens.length > 0 ? (
            <button
              type="button"
              onClick={() => void sincronizarFila()}
              disabled={sincronizando}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw
                className={cn("size-3.5", sincronizando && "animate-spin")}
                aria-hidden="true"
              />
              {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
            </button>
          ) : null}
        </div>

        {itens.length > 0 ? (
          <ul className="mt-3.5 space-y-2 border-t border-border/60 pt-3">
            {itens.map((item) => (
              <li
                key={item.idRegistro}
                className="flex flex-wrap items-start justify-between gap-2 rounded-sm border border-border bg-card p-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
                      {rotuloTipo(item.tipo)}
                    </span>
                    <span className="font-medium text-foreground">{item.residenteNome}</span>
                    <span className="text-muted-foreground">·</span>
                    <time
                      dateTime={item.criadoEmDispositivo}
                      className="text-muted-foreground"
                    >
                      {dataHora(item.criadoEmDispositivo)}
                    </time>
                  </div>
                  <p className="mt-1 font-medium text-foreground">{item.titulo}</p>
                  {item.ultimoErro ? (
                    <p className="mt-1 text-danger">{item.ultimoErro}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => pedirDescarte(item)}
                  disabled={sincronizando}
                  aria-label={`Descartar registro pendente "${item.titulo}"`}
                  className="inline-flex min-h-8 items-center gap-1 rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Descartar
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloId}
        onClose={() => setAlvoDescarte(null)}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <h3 id={tituloId} className="font-heading text-lg font-semibold">
            Descartar registro local?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O registro{" "}
            <span className="font-medium text-foreground">
              {alvoDescarte?.titulo ?? ""}
            </span>{" "}
            ainda não foi enviado ao servidor. Se você descartá-lo agora, ele não será gravado
            na linha do tempo do residente.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <button
              ref={cancelarRef}
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Manter na fila
            </button>
            <button
              type="button"
              onClick={() => void confirmarDescarte()}
              className="inline-flex min-h-10 items-center justify-center rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90"
            >
              Descartar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
