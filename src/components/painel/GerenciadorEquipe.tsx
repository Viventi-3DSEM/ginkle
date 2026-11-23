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
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import Switch from "@/components/painel/Switch";
import {
  adicionarMembroEquipe,
  alterarCargoEquipe,
  alternarAtivoEquipe,
  removerMembroEquipe,
  type Estado,
} from "@/lib/painel/actions";
import type { MembroEquipe } from "@/lib/painel/dados";
import { dataCurta, iniciais } from "@/lib/painel/formato";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { cn } from "@/lib/utils";

type CasaResumo = {
  id: string;
  nome: string;
  slug: string;
};

type Props = {
  casas: CasaResumo[];
  membros: MembroEquipe[];
  casaInicialId?: string;
};

type FiltroStatus = "ATIVOS" | "TODOS" | "INATIVOS";

const inputClass =
  "min-h-11 w-full border-b border-input bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

function CardMembro({
  membro,
  mostrarCasa,
  onAviso,
  onPedirRemocao,
  onPedirPromocao,
}: {
  membro: MembroEquipe;
  mostrarCasa: boolean;
  onAviso: (msg: string) => void;
  onPedirRemocao: (membro: MembroEquipe) => void;
  onPedirPromocao: (membro: MembroEquipe) => void;
}) {
  const [erroLinha, setErroLinha] = useState("");
  const [alterandoAtivo, startAtivo] = useTransition();
  const [alterandoCargo, startCargo] = useTransition();
  const [ativoLocal, setAtivoLocal] = useOptimistic(membro.ativo);
  const [cargoLocal, setCargoLocal] = useOptimistic(membro.cargo);

  const switchId = useId();
  const cargoId = useId();

  function aoAlternarAtivo(proximo: boolean) {
    setErroLinha("");
    startAtivo(async () => {
      setAtivoLocal(proximo);
      const res = await alternarAtivoEquipe(membro.id, membro.casaId, proximo);
      if (res.erro) setErroLinha(res.erro);
    });
  }

  function aoTrocarCargo(novoCargo: string) {
    if (novoCargo === membro.cargo) return;
    if (novoCargo === "GESTOR") {
      onPedirPromocao(membro);
      return;
    }
    setErroLinha("");
    startCargo(async () => {
      setCargoLocal(novoCargo);
      const res = await alterarCargoEquipe(membro.id, membro.casaId, novoCargo);
      if (res.erro) setErroLinha(res.erro);
      else if (res.ok) onAviso(res.ok);
    });
  }

  return (
    <li className="rounded-sm border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-sm font-bold text-brand-strong"
          >
            {iniciais(membro.nome)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">{membro.nome}</h3>
              {membro.ehVoce ? (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
                  Você
                </span>
              ) : null}
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                  cargoLocal === "GESTOR"
                    ? "bg-secondary text-brand-strong"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {cargoLocal === "GESTOR" ? "Gestor" : "Funcionário"}
              </span>
              {!ativoLocal ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inativo
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {mostrarCasa ? (
                <span className="font-medium text-foreground">{membro.casaNome}</span>
              ) : null}
              {membro.email ? (
                <span className="inline-flex items-center gap-1 break-all">
                  <Mail className="size-3 shrink-0" aria-hidden="true" />
                  {membro.email}
                </span>
              ) : null}
              {membro.telefone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3 shrink-0" aria-hidden="true" />
                  {formatarTelefone(membro.telefone)}
                </span>
              ) : null}
              <span>Desde {dataCurta(membro.desde)}</span>
            </div>

            {erroLinha ? (
              <p role="alert" className="mt-2 text-xs text-danger">
                {erroLinha}
              </p>
            ) : null}
          </div>
        </div>

        {membro.ehVoce ? (
          <p className="text-xs text-muted-foreground sm:pt-1">Acesso atual</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
            <div>
              <label htmlFor={cargoId} className="sr-only">
                Cargo de {membro.nome}
              </label>
              <select
                id={cargoId}
                value={cargoLocal}
                disabled={alterandoCargo}
                onChange={(e) => aoTrocarCargo(e.target.value)}
                className="min-h-9 rounded-sm border border-border bg-card px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:border-brand-strong disabled:opacity-50"
              >
                <option value="FUNCIONARIO">Funcionário</option>
                <option value="GESTOR">Gestor</option>
              </select>
            </div>

            <label
              htmlFor={switchId}
              className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground select-none"
            >
              <Switch
                id={switchId}
                checked={ativoLocal}
                disabled={alterandoAtivo}
                onChange={aoAlternarAtivo}
              />
              <span>{ativoLocal ? "Ativo" : "Inativo"}</span>
            </label>

            <button
              type="button"
              onClick={() => onPedirRemocao(membro)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:border-danger/60 hover:bg-danger/10"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remover
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function GerenciadorEquipe({ casas, membros, casaInicialId }: Props) {
  const casaValidaInicial =
    casaInicialId && casas.some((c) => c.id === casaInicialId) ? casaInicialId : "TODAS";

  const [filtroCasa, setFiltroCasa] = useState<string>(
    casas.length === 1 ? casas[0].id : casaValidaInicial,
  );
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("ATIVOS");
  const [busca, setBusca] = useState("");
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [casaNova, setCasaNova] = useState<string>(
    casaValidaInicial !== "TODAS" ? casaValidaInicial : (casas[0]?.id ?? ""),
  );
  const [emailNovo, setEmailNovo] = useState("");
  const [cargoNovo, setCargoNovo] = useState("FUNCIONARIO");
  const [avisoOk, setAvisoOk] = useState("");
  const [alvoModal, setAlvoModal] = useState<
    { tipo: "remover" | "promover"; membro: MembroEquipe } | null
  >(null);
  const [erroDialogo, setErroDialogo] = useState("");
  const [promovendo, startPromocao] = useTransition();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarBtnRef = useRef<HTMLButtonElement>(null);

  const formId = useId();
  const buscaId = useId();
  const tituloDialogId = useId();
  const descDialogId = useId();

  const [estadoCriar, acaoCriar, adicionando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await adicionarMembroEquipe(prev, formData);
      if (res.ok) {
        setAvisoOk(res.ok);
        setMostrarFormNovo(false);
        setEmailNovo("");
        setCargoNovo("FUNCIONARIO");
      }
      return res;
    },
    {},
  );

  const [, acaoRemover, removendo] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await removerMembroEquipe(prev, formData);
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

  const ocupandoModal = removendo || promovendo;
  const ocupandoRef = useRef(ocupandoModal);
  useEffect(() => {
    ocupandoRef.current = ocupandoModal;
    const dialog = dialogRef.current;
    if (dialog) dialog.setAttribute("closedby", ocupandoModal ? "none" : "any");
  }, [ocupandoModal]);

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
      if (!ocupandoRef.current && pressionouFora && fora(e)) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  function abrirModal(tipo: "remover" | "promover", membro: MembroEquipe) {
    setErroDialogo("");
    setAvisoOk("");
    setAlvoModal({ tipo, membro });
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarBtnRef.current?.focus();
    }
  }

  function confirmarPromocao() {
    if (!alvoModal || alvoModal.tipo !== "promover") return;
    const { id, casaId } = alvoModal.membro;
    setErroDialogo("");
    startPromocao(async () => {
      const res = await alterarCargoEquipe(id, casaId, "GESTOR");
      if (res.erro) {
        setErroDialogo(res.erro);
      } else {
        setAvisoOk(res.ok ?? "Cargo atualizado para Gestor.");
        dialogRef.current?.close("confirmed");
      }
    });
  }

  const membrosDaCasaFiltro = useMemo(
    () =>
      filtroCasa === "TODAS" ? membros : membros.filter((m) => m.casaId === filtroCasa),
    [membros, filtroCasa],
  );

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return membrosDaCasaFiltro.filter((m) => {
      if (filtroStatus === "ATIVOS" && !m.ativo) return false;
      if (filtroStatus === "INATIVOS" && m.ativo) return false;
      if (
        termo &&
        !m.nome.toLowerCase().includes(termo) &&
        !m.email.toLowerCase().includes(termo)
      ) {
        return false;
      }
      return true;
    });
  }, [membrosDaCasaFiltro, filtroStatus, busca]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {casas.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar equipe por casa">
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
                {membros.length}
              </span>
            </button>

            {casas.map((casa) => {
              const qtd = membros.filter((m) => m.casaId === casa.id).length;
              const ativo = filtroCasa === casa.id;
              return (
                <button
                  key={casa.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => {
                    setFiltroCasa(casa.id);
                    setCasaNova(casa.id);
                  }}
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
                      ativo ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted",
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
              Adicionar profissional
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
          aria-labelledby={`${formId}-titulo`}
          className="rounded-sm border border-border bg-card p-5 sm:p-6"
        >
          <h2 id={`${formId}-titulo`} className="font-heading text-lg font-semibold">
            Adicionar profissional
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Informe o e-mail de uma conta já cadastrada no Ginkle para liberar o acesso à casa.
          </p>

          <form
            aria-labelledby={`${formId}-titulo`}
            action={acaoCriar}
            className="mt-5 space-y-5"
          >
            {casas.length > 1 ? (
              <div>
                <label htmlFor={`${formId}-casa`} className={labelClass}>
                  Casa *
                </label>
                <select
                  id={`${formId}-casa`}
                  name="casaId"
                  required
                  value={filtroCasa !== "TODAS" ? filtroCasa : casaNova}
                  onChange={(e) => setCasaNova(e.target.value)}
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
                <label htmlFor={`${formId}-email`} className={labelClass}>
                  E-mail da conta *
                </label>
                <input
                  id={`${formId}-email`}
                  name="email"
                  type="email"
                  required
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="profissional@email.com"
                  value={emailNovo}
                  onChange={(e) => setEmailNovo(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor={`${formId}-cargo`} className={labelClass}>
                  Cargo *
                </label>
                <select
                  id={`${formId}-cargo`}
                  name="cargo"
                  required
                  value={cargoNovo}
                  onChange={(e) => setCargoNovo(e.target.value)}
                  className={cn(inputClass, "bg-card")}
                >
                  <option value="FUNCIONARIO">Funcionário</option>
                  <option value="GESTOR">Gestor</option>
                </select>
              </div>
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
                disabled={adicionando}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {adicionando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {adicionando ? "Adicionando..." : "Adicionar à equipe"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormNovo(false)}
                disabled={adicionando}
                className="inline-flex min-h-11 items-center rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
          {(
            [
              { valor: "ATIVOS", rotulo: "Ativos" },
              { valor: "TODOS", rotulo: "Todos" },
              { valor: "INATIVOS", rotulo: "Inativos" },
            ] as const
          ).map((op) => (
            <button
              key={op.valor}
              type="button"
              aria-pressed={filtroStatus === op.valor}
              onClick={() => setFiltroStatus(op.valor)}
              className={cn(
                "inline-flex min-h-9 items-center rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                filtroStatus === op.valor
                  ? "bg-secondary text-brand-strong"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {op.rotulo}
            </button>
          ))}
        </div>

        <search className="relative w-full sm:max-w-xs">
          <label htmlFor={buscaId} className="sr-only">
            Buscar profissional por nome ou e-mail
          </label>
          <Search
            className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id={buscaId}
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar profissional..."
            autoCorrect="off"
            spellCheck={false}
            className="min-h-10 w-full border-b border-input bg-transparent py-1.5 pl-6 pr-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm"
          />
        </search>
      </div>

      <p aria-live="polite" className="sr-only">
        {visiveis.length === 1
          ? "Mostrando 1 profissional."
          : `Mostrando ${visiveis.length} profissionais.`}
      </p>

      {visiveis.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <UserCog className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-base font-semibold">
            Nenhum profissional encontrado
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Tente limpar a busca ou trocar o filtro de situação.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((membro) => (
            <CardMembro
              key={membro.id}
              membro={membro}
              mostrarCasa={filtroCasa === "TODAS" && casas.length > 1}
              onAviso={setAvisoOk}
              onPedirRemocao={(m) => abrirModal("remover", m)}
              onPedirPromocao={(m) => abrirModal("promover", m)}
            />
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloDialogId}
        aria-describedby={descDialogId}
        onCancel={(e) => {
          if (ocupandoModal) e.preventDefault();
        }}
        onClose={(e) => {
          e.currentTarget.returnValue = "";
          setAlvoModal(null);
          setErroDialogo("");
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={tituloDialogId} className="font-heading text-lg font-semibold">
              {alvoModal?.tipo === "promover"
                ? "Promover para Gestor?"
                : "Remover profissional?"}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={ocupandoModal}
              aria-label="Fechar janela"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p id={descDialogId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {alvoModal?.tipo === "promover" ? (
              <>
                <span className="font-semibold text-foreground">{alvoModal.membro.nome}</span>{" "}
                passará a ter acesso administrativo completo a{" "}
                <span className="font-medium text-foreground">{alvoModal.membro.casaNome}</span>,
                incluindo equipe, planos, financeiro e auditoria.
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {alvoModal?.membro.nome ?? "Este profissional"}
                </span>{" "}
                perderá o acesso a{" "}
                <span className="font-medium text-foreground">{alvoModal?.membro.casaNome}</span>.
                Se ele já tiver registros de cuidados lançados, use o controle de ativação para
                desativar o acesso mantendo o histórico.
              </>
            )}
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
              autoFocus
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={ocupandoModal}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>

            {alvoModal?.tipo === "promover" ? (
              <button
                type="button"
                onClick={confirmarPromocao}
                disabled={ocupandoModal}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {promovendo ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {promovendo ? "Promovendo..." : "Confirmar promoção"}
              </button>
            ) : (
              <form action={acaoRemover}>
                <input type="hidden" name="id" value={alvoModal?.membro.id ?? ""} />
                <input type="hidden" name="casaId" value={alvoModal?.membro.casaId ?? ""} />
                <button
                  type="submit"
                  disabled={ocupandoModal || !alvoModal}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
                >
                  {removendo ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {removendo ? "Removendo..." : "Remover da equipe"}
                </button>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
