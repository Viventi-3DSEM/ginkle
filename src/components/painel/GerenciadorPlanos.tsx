"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Switch from "@/components/painel/Switch";
import {
  alternarPlanoAtivo,
  atualizarPlano,
  criarPlano,
  excluirPlano,
  type Estado,
} from "@/lib/painel/actions";
import type { PlanoDoGestor } from "@/lib/painel/dados";
import { reais } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

type CasaResumo = {
  id: string;
  nome: string;
  slug: string;
  publicado: boolean;
};

type Props = {
  casas: CasaResumo[];
  planos: PlanoDoGestor[];
  casaInicialId?: string;
};

const inputClass =
  "min-h-11 w-full border-b border-input bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

function formatarValorInput(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CardPlano({
  plano,
  mostrarCasa,
  onPedirExclusao,
  onAviso,
}: {
  plano: PlanoDoGestor;
  mostrarCasa: boolean;
  onPedirExclusao: (plano: PlanoDoGestor) => void;
  onAviso: (msg: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [erroSwitch, setErroSwitch] = useState("");
  const [alternando, startTransition] = useTransition();
  const [ativoLocal, setAtivoLocal] = useOptimistic(plano.ativo);

  const switchId = useId();
  const nomeId = useId();
  const valorId = useId();
  const descId = useId();

  const [estadoEditar, acaoEditar, salvando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await atualizarPlano(prev, formData);
      if (res.ok) {
        setEditando(false);
        onAviso(res.ok);
      }
      return res;
    },
    {},
  );

  function aoAlternarAtivo(proximo: boolean) {
    setErroSwitch("");
    startTransition(async () => {
      setAtivoLocal(proximo);
      const res = await alternarPlanoAtivo(plano.id, plano.casaId, proximo);
      if (res.erro) setErroSwitch(res.erro);
    });
  }

  if (editando) {
    return (
      <li className="rounded-sm border border-brand-strong/40 bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-base font-semibold">Editar plano</h3>
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={salvando}
            aria-label="Fechar edição"
            className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form action={acaoEditar} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={plano.id} />
          <input type="hidden" name="casaId" value={plano.casaId} />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor={nomeId} className={labelClass}>
                Nome do plano *
              </label>
              <input
                id={nomeId}
                name="nome"
                required
                maxLength={80}
                defaultValue={plano.nome}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={valorId} className={labelClass}>
                Mensalidade (R$) *
              </label>
              <input
                id={valorId}
                name="valor"
                required
                inputMode="decimal"
                defaultValue={formatarValorInput(plano.valor)}
                placeholder="3.200,00"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor={descId} className={labelClass}>
              Descrição (opcional)
            </label>
            <textarea
              id={descId}
              name="descricao"
              rows={2}
              maxLength={300}
              defaultValue={plano.descricao ?? ""}
              placeholder="O que está incluído neste plano."
              className={cn(inputClass, "resize-y")}
            />
          </div>

          {estadoEditar.erro ? (
            <p
              role="alert"
              className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{estadoEditar.erro}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={salvando}
              className="inline-flex min-h-10 items-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-sm border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-semibold">{plano.nome}</h3>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                ativoLocal
                  ? "bg-secondary text-brand-strong"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {ativoLocal ? "Ativo" : "Inativo"}
            </span>
          </div>

          {mostrarCasa ? (
            <p className="mt-1 text-xs text-muted-foreground">{plano.casaNome}</p>
          ) : null}

          <p className="mt-2 font-heading text-xl font-semibold">
            R$ {reais(plano.valor)}
            <span className="font-sans text-xs font-normal text-muted-foreground">/mês</span>
          </p>

          {plano.descricao ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {plano.descricao}
            </p>
          ) : null}

          {erroSwitch ? (
            <p role="alert" className="mt-2 text-xs text-danger">
              {erroSwitch}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
          <label
            htmlFor={switchId}
            className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground select-none"
          >
            <Switch
              id={switchId}
              checked={ativoLocal}
              disabled={alternando}
              onChange={aoAlternarAtivo}
            />
            <span>{ativoLocal ? "Ativo" : "Inativo"}</span>
          </label>

          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Editar
          </button>

          <button
            type="button"
            onClick={() => onPedirExclusao(plano)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:border-danger/60 hover:bg-danger/10"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Excluir
          </button>
        </div>
      </div>
    </li>
  );
}

export default function GerenciadorPlanos({ casas, planos, casaInicialId }: Props) {
  const casaValidaInicial =
    casaInicialId && casas.some((c) => c.id === casaInicialId) ? casaInicialId : "TODAS";

  const [filtroCasa, setFiltroCasa] = useState<string>(
    casas.length === 1 ? casas[0].id : casaValidaInicial,
  );
  const [mostrarFormNovo, setMostrarFormNovo] = useState(planos.length === 0);
  const [avisoOk, setAvisoOk] = useState("");
  const [alvoExcluir, setAlvoExcluir] = useState<PlanoDoGestor | null>(null);
  const [erroDialogo, setErroDialogo] = useState("");
  const [formKey, setFormKey] = useState(0);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarBtnRef = useRef<HTMLButtonElement>(null);

  const tituloFormId = useId();
  const casaSelectId = useId();
  const novoNomeId = useId();
  const novoValorId = useId();
  const novoDescId = useId();
  const tituloDialogId = useId();
  const descDialogId = useId();

  const [estadoCriar, acaoCriar, criando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await criarPlano(prev, formData);
      if (res.ok) {
        setAvisoOk(res.ok);
        setMostrarFormNovo(false);
        setFormKey((k) => k + 1);
      }
      return res;
    },
    {},
  );

  const [, acaoExcluir, excluindo] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await excluirPlano(prev, formData);
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
    const onDown = (e: PointerEvent) => {
      pressionouFora = fora(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressionouFora && fora(e)) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  function abrirExclusao(plano: PlanoDoGestor) {
    setErroDialogo("");
    setAvisoOk("");
    setAlvoExcluir(plano);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarBtnRef.current?.focus();
    }
  }

  const visiveis = useMemo(() => {
    if (filtroCasa === "TODAS") return planos;
    return planos.filter((p) => p.casaId === filtroCasa);
  }, [planos, filtroCasa]);

  const casaPadraoForm = filtroCasa !== "TODAS" ? filtroCasa : (casas[0]?.id ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {casas.length > 1 ? (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar planos por casa"
          >
            <button
              type="button"
              aria-pressed={filtroCasa === "TODAS"}
              onClick={() => setFiltroCasa("TODAS")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                filtroCasa === "TODAS"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>Todas as casas</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                  filtroCasa === "TODAS"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {planos.length}
              </span>
            </button>

            {casas.map((casa) => {
              const qtd = planos.filter((p) => p.casaId === casa.id).length;
              const ativo = filtroCasa === casa.id;
              return (
                <button
                  key={casa.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setFiltroCasa(casa.id)}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span>{casa.nome}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                      ativo
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {qtd}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => {
            setAvisoOk("");
            setMostrarFormNovo((v) => !v);
          }}
          aria-expanded={mostrarFormNovo}
          className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {mostrarFormNovo ? (
            <>
              <X className="size-4" aria-hidden="true" />
              Fechar
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              Novo plano
            </>
          )}
        </button>
      </div>

      {avisoOk ? (
        <p
          role="status"
          className="flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <span>{avisoOk}</span>
        </p>
      ) : null}

      {mostrarFormNovo ? (
        <section
          aria-labelledby={tituloFormId}
          className="rounded-sm border border-border bg-card p-5 sm:p-6"
        >
          <h2 id={tituloFormId} className="font-heading text-lg font-semibold">
            Novo plano
          </h2>

          <form
            key={`${formKey}-${casaPadraoForm}`}
            aria-labelledby={tituloFormId}
            action={acaoCriar}
            className="mt-5 space-y-5"
          >
            {casas.length > 1 ? (
              <div>
                <label htmlFor={casaSelectId} className={labelClass}>
                  Casa *
                </label>
                <select
                  id={casaSelectId}
                  name="casaId"
                  required
                  defaultValue={casaPadraoForm}
                  className={cn(inputClass, "bg-card")}
                >
                  {casas.map((casa) => (
                    <option key={casa.id} value={casa.id}>
                      {casa.nome}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input type="hidden" name="casaId" value={casas[0]?.id ?? ""} />
            )}

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor={novoNomeId} className={labelClass}>
                  Nome do plano *
                </label>
                <input
                  id={novoNomeId}
                  name="nome"
                  required
                  maxLength={80}
                  placeholder="Ex.: Suíte individual"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor={novoValorId} className={labelClass}>
                  Mensalidade (R$) *
                </label>
                <input
                  id={novoValorId}
                  name="valor"
                  required
                  inputMode="decimal"
                  placeholder="3.200,00"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor={novoDescId} className={labelClass}>
                Descrição (opcional)
              </label>
              <textarea
                id={novoDescId}
                name="descricao"
                rows={2}
                maxLength={300}
                placeholder="Acomodação, cuidados incluídos e diferenciais."
                className={cn(inputClass, "resize-y")}
              />
            </div>

            {estadoCriar.erro ? (
              <p
                role="alert"
                className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>{estadoCriar.erro}</span>
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={criando}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {criando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {criando ? "Salvando..." : "Adicionar plano"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormNovo(false)}
                disabled={criando}
                className="inline-flex min-h-11 items-center rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {visiveis.length === 1
          ? "Mostrando 1 plano."
          : `Mostrando ${visiveis.length} planos.`}
      </p>

      {visiveis.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Tag className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-base font-semibold">Nenhum plano cadastrado</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Adicione opções de mensalidade para as famílias conhecerem os valores da casa.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((plano) => (
            <CardPlano
              key={plano.id}
              plano={plano}
              mostrarCasa={filtroCasa === "TODAS" && casas.length > 1}
              onPedirExclusao={abrirExclusao}
              onAviso={setAvisoOk}
            />
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloDialogId}
        aria-describedby={descDialogId}
        onClose={(e) => {
          e.currentTarget.returnValue = "";
          setAlvoExcluir(null);
          setErroDialogo("");
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={tituloDialogId} className="font-heading text-lg font-semibold">
              Excluir plano?
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={excluindo}
              aria-label="Fechar janela"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p id={descDialogId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            O plano{" "}
            <span className="font-semibold text-foreground">
              {alvoExcluir?.nome ?? "selecionado"}
            </span>{" "}
            será removido permanentemente de{" "}
            <span className="font-medium text-foreground">{alvoExcluir?.casaNome}</span>. Se
            preferir apenas ocultá-lo, use o controle de ativação.
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
              ref={cancelarBtnRef}
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={excluindo}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>

            <form action={acaoExcluir}>
              <input type="hidden" name="id" value={alvoExcluir?.id ?? ""} />
              <input type="hidden" name="casaId" value={alvoExcluir?.casaId ?? ""} />
              <button
                type="submit"
                disabled={excluindo || !alvoExcluir}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {excluindo ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {excluindo ? "Excluindo..." : "Excluir plano"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
