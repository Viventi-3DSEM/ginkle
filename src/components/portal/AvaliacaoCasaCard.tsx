"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { ExternalLink, Loader2, Star, Trash2 } from "lucide-react";
import {
  removerAvaliacao,
  salvarAvaliacao,
  type EstadoAcao,
} from "@/lib/portal/actions";
import type { CasaParaAvaliar } from "@/lib/portal/dados";
import { dataCurta } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

const ROTULO_NOTA: Record<number, string> = {
  1: "Muito insatisfeito",
  2: "Insatisfeito",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

const INICIAL: EstadoAcao = {};

export default function AvaliacaoCasaCard({ casa }: { casa: CasaParaAvaliar }) {
  const baseId = useId();
  const [estado, acao, enviando] = useActionState(salvarAvaliacao, INICIAL);
  const [nota, setNota] = useState<number>(casa.avaliacao?.nota ?? 5);
  const [comentario, setComentario] = useState<string>(casa.avaliacao?.comentario ?? "");
  const [erroRemover, setErroRemover] = useState("");
  const [removendo, startRemocao] = useTransition();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const removendoRef = useRef(false);
  const dialogTituloId = useId();

  useEffect(() => {
    removendoRef.current = removendo;
    const dialog = dialogRef.current;
    if (dialog) dialog.setAttribute("closedby", removendo ? "none" : "any");
  }, [removendo]);

  function abrirConfirmacaoRemocao() {
    setErroRemover("");
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarRef.current?.focus();
    }
  }

  function confirmarRemocao() {
    if (!casa.avaliacao) return;
    setErroRemover("");
    startRemocao(async () => {
      const res = await removerAvaliacao(casa.avaliacao!.id, casa.casaId);
      if (res.erro) {
        setErroRemover(res.erro);
      } else {
        setNota(5);
        setComentario("");
        dialogRef.current?.close();
      }
    });
  }

  const podeEnviar = casa.publicado || Boolean(casa.avaliacao);

  return (
    <>
      <article className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4 border-b border-border pb-4">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
            <Image
              src={casa.capaUrl ?? "/images/casa.jpg"}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">{casa.nome}</h2>
              {casa.avaliacao ? (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
                  Avaliada em {dataCurta(casa.avaliacao.data)}
                </span>
              ) : null}
              {!casa.publicado ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fora do diretório
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {casa.bairro}, {casa.cidade} · {casa.uf}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Residente{casa.residentesNomes.length > 1 ? "s" : ""}:{" "}
              <span className="font-medium text-foreground">{casa.residentesNomes.join(", ")}</span>
            </p>
          </div>

          {casa.publicado ? (
            <Link
              href={`/casas/${casa.slug}`}
              target="_blank"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Ver página
            </Link>
          ) : null}
        </div>

        {!podeEnviar ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Esta instituição ainda não está publicada no diretório público. Assim que for
            publicada, você poderá deixar sua avaliação aqui.
          </p>
        ) : (
          <form action={acao} className="mt-5 space-y-5">
            <input type="hidden" name="casaId" value={casa.casaId} />
            {casa.avaliacao ? (
              <input type="hidden" name="avaliacaoId" value={casa.avaliacao.id} />
            ) : null}

            <fieldset className="space-y-2.5">
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Sua nota <span aria-hidden="true">*</span>
              </legend>

              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((valor) => {
                  const radioId = `${baseId}-nota-${valor}`;
                  const marcada = valor <= nota;
                  return (
                    <div key={valor} className="relative">
                      <input
                        id={radioId}
                        type="radio"
                        name="nota"
                        value={valor}
                        checked={nota === valor}
                        onChange={() => setNota(valor)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={radioId}
                        className={cn(
                          "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-sm border px-3 text-sm font-semibold transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                          marcada
                            ? "border-brand-strong bg-secondary text-brand-strong"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary/40",
                        )}
                      >
                        <Star
                          className={cn("size-4", marcada && "fill-current")}
                          aria-hidden="true"
                        />
                        <span>{valor}</span>
                      </label>
                    </div>
                  );
                })}
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  {ROTULO_NOTA[nota]}
                </span>
              </div>
            </fieldset>

            <div>
              <label
                htmlFor={`${baseId}-comentario`}
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Comentário (opcional)
              </label>
              <textarea
                id={`${baseId}-comentario`}
                name="comentario"
                rows={3}
                maxLength={1000}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Conte como tem sido o atendimento, a comunicação da equipe e a estrutura da casa..."
                className="mt-1 w-full resize-y border-b border-input bg-transparent py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand-strong sm:text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Seu comentário aparece no diretório público apenas com seu primeiro nome e inicial
                do sobrenome.
              </p>
            </div>

            {estado.erro ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {estado.erro}
              </p>
            ) : null}
            {estado.ok ? (
              <p role="status" className="text-sm font-medium text-success">
                {estado.ok}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {casa.avaliacao ? (
                <button
                  type="button"
                  onClick={abrirConfirmacaoRemocao}
                  disabled={enviando || removendo}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remover avaliação
                </button>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={enviando || removendo}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Salvando...
                  </>
                ) : casa.avaliacao ? (
                  "Atualizar avaliação"
                ) : (
                  "Publicar avaliação"
                )}
              </button>
            </div>
          </form>
        )}
      </article>

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTituloId}
        onCancel={(e) => {
          if (removendoRef.current) e.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <h3 id={dialogTituloId} className="font-heading text-lg font-semibold">
            Remover sua avaliação?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sua nota e comentário sobre{" "}
            <span className="font-medium text-foreground">{casa.nome}</span> deixarão de aparecer
            na página pública da instituição. Você poderá avaliar novamente depois.
          </p>
          {erroRemover ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {erroRemover}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <button
              ref={cancelarRef}
              type="button"
              disabled={removendo}
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={removendo}
              onClick={confirmarRemocao}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {removendo ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
