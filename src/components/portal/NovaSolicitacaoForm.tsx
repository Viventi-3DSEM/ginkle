"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BedDouble,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Send,
} from "lucide-react";
import { solicitarAdesao, type EstadoAcao } from "@/lib/portal/actions";
import type { CasaDisponivel } from "@/lib/portal/dados";
import { cn } from "@/lib/utils";

type Props = {
  casas: CasaDisponivel[];
  pendentesIds: string[];
  vinculadasIds: string[];
  casaInicialSlug?: string;
};

export default function NovaSolicitacaoForm({
  casas,
  pendentesIds,
  vinculadasIds,
  casaInicialSlug,
}: Props) {
  const selectId = useId();
  const tituloId = useId();
  const ajudaId = useId();
  const erroId = useId();

  const selectRef = useRef<HTMLSelectElement>(null);

  const pendentesSet = useMemo(() => new Set(pendentesIds), [pendentesIds]);
  const vinculadasSet = useMemo(() => new Set(vinculadasIds), [vinculadasIds]);

  const casaInicial = useMemo(
    () => (casaInicialSlug ? casas.find((c) => c.slug === casaInicialSlug) ?? null : null),
    [casas, casaInicialSlug],
  );

  const [selecionada, setSelecionada] = useState<string>(() => {
    if (casaInicial && !pendentesIds.includes(casaInicial.id)) return casaInicial.id;
    return "";
  });
  const [interagiu, setInteragiu] = useState(false);
  const [erroLocal, setErroLocal] = useState("");
  const [estado, acao, enviando] = useActionState<EstadoAcao, FormData>(solicitarAdesao, {});

  // Após enviar com sucesso, o servidor devolve a casa em pendentesIds; derivar
  // o valor evita deixar selecionada uma opção que acabou de ficar desabilitada.
  const valorSelect = pendentesSet.has(selecionada) ? "" : selecionada;
  const casaEscolhida = useMemo(
    () => casas.find((c) => c.id === valorSelect) ?? null,
    [casas, valorSelect],
  );

  const disponiveisCount = useMemo(
    () => casas.filter((c) => !pendentesSet.has(c.id)).length,
    [casas, pendentesSet],
  );

  const casaInicialJaPendente =
    casaInicial !== null && pendentesSet.has(casaInicial.id) && estado.id !== casaInicial.id;

  const mostrarErroSelect = Boolean(erroLocal);
  const describedBy = mostrarErroSelect ? `${ajudaId} ${erroId}` : ajudaId;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!valorSelect) {
      event.preventDefault();
      setInteragiu(true);
      setErroLocal("Escolha uma instituição da lista para enviar a solicitação.");
      selectRef.current?.focus();
    }
  }

  return (
    <section
      aria-labelledby={tituloId}
      className="rounded-sm border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id={tituloId} className="font-heading text-lg font-semibold">
            Nova solicitação de entrada
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Escolha a instituição para enviar sua solicitação.
          </p>
        </div>
        <Link
          href="/casas"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong hover:underline"
        >
          Explorar diretório
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {casaInicialJaPendente ? (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 border-l-2 border-brand-strong bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
          <span>
            Você já tem uma solicitação pendente para{" "}
            <span className="font-semibold">{casaInicial.nome}</span>. Acompanhe o andamento ou
            cancele o pedido na lista abaixo.
          </span>
        </p>
      ) : null}

      {casas.length === 0 ? (
        <div className="mt-5 rounded-sm border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma instituição publicada no diretório no momento.
          </p>
          <Link
            href="/casas"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong hover:underline"
          >
            Ver diretório público
          </Link>
        </div>
      ) : disponiveisCount === 0 ? (
        <p
          role="status"
          className="mt-5 rounded-sm border border-dashed border-border bg-background/60 p-5 text-sm text-muted-foreground"
        >
          Você já tem solicitações pendentes para todas as instituições publicadas no diretório.
        </p>
      ) : (
        <form
          aria-labelledby={tituloId}
          action={acao}
          onSubmit={onSubmit}
          noValidate
          className="mt-5 space-y-5"
        >
          <div>
            <label
              htmlFor={selectId}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Instituição <span aria-hidden="true">*</span>
            </label>
            <select
              ref={selectRef}
              id={selectId}
              name="casaId"
              required
              value={valorSelect}
              aria-invalid={mostrarErroSelect ? "true" : "false"}
              aria-describedby={describedBy}
              onChange={(e) => {
                setSelecionada(e.target.value);
                setInteragiu(true);
                if (e.target.value) setErroLocal("");
              }}
              onBlur={() => {
                if (interagiu && !valorSelect) {
                  setErroLocal("Escolha uma instituição da lista para enviar a solicitação.");
                }
              }}
              className={cn(
                "min-h-12 w-full border-b bg-card py-2.5 pr-8 text-base outline-none transition-colors focus-visible:border-brand-strong sm:text-sm",
                mostrarErroSelect
                  ? "border-danger"
                  : "border-input user-invalid:border-danger",
              )}
            >
              <option value="" disabled>
                Selecione uma casa de repouso...
              </option>
              {casas.map((casa) => {
                const jaPendente = pendentesSet.has(casa.id);
                const vagasTexto =
                  casa.vagas > 0
                    ? `${casa.vagas} vaga${casa.vagas === 1 ? "" : "s"}`
                    : "consultar vagas";
                return (
                  <option key={casa.id} value={casa.id} disabled={jaPendente}>
                    {casa.nome} — {casa.bairro}, {casa.cidade}/{casa.uf} ({vagasTexto})
                    {jaPendente ? " · solicitação pendente" : ""}
                  </option>
                );
              })}
            </select>

            <p id={ajudaId} className="mt-2 text-xs text-muted-foreground">
              É permitido manter uma solicitação pendente por instituição. Se cancelar ou houver
              recusa, você pode enviar um novo pedido.
            </p>

            {mostrarErroSelect ? (
              <p
                id={erroId}
                role="alert"
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger"
              >
                <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                {erroLocal}
              </p>
            ) : null}
          </div>

          {casaEscolhida ? (
            <div className="rounded-sm border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {casaEscolhida.nome}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {casaEscolhida.bairro}, {casaEscolhida.cidade} · {casaEscolhida.uf}
                    </span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BedDouble className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {casaEscolhida.vagas > 0
                        ? `${casaEscolhida.vagas} vaga${casaEscolhida.vagas === 1 ? "" : "s"} informada${casaEscolhida.vagas === 1 ? "" : "s"} no diretório`
                        : "Disponibilidade de vagas sob consulta"}
                    </span>
                  </p>
                </div>

                <Link
                  href={`/casas/${casaEscolhida.slug}`}
                  target="_blank"
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Ver ficha da casa
                </Link>
              </div>

              {vinculadasSet.has(casaEscolhida.id) ? (
                <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
                  Nota: você já tem um residente vinculado a esta casa. Envie o pedido apenas se
                  precisar solicitar uma nova entrada.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              {enviando ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        </form>
      )}

      {estado.ok ? (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <span>{estado.ok}</span>
        </p>
      ) : null}

      {estado.erro ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 border-l-2 border-danger bg-card px-4 py-3 text-xs leading-relaxed text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{estado.erro}</span>
        </p>
      ) : null}
    </section>
  );
}
