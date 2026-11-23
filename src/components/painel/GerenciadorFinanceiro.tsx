"use client";

import Link from "next/link";
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
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Receipt,
  Search,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  atualizarStatusAssinatura,
  atualizarStatusFatura,
  criarAssinatura,
  criarFatura,
  type Estado,
} from "@/lib/painel/actions";
import type {
  AssinaturaDoGestor,
  CandidatoAssinante,
  FaturaDoGestor,
  PlanoOpcaoFinanceiro,
} from "@/lib/painel/dados";
import { dataCurta, iniciais, reais } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

type CasaResumo = {
  id: string;
  nome: string;
  slug: string;
};

type Props = {
  casas: CasaResumo[];
  planos: PlanoOpcaoFinanceiro[];
  candidatos: CandidatoAssinante[];
  assinaturas: AssinaturaDoGestor[];
  casaInicialId?: string;
  hojeIso: string;
  proximoVencimentoIso: string;
};

function StatFinanceiro({
  rotulo,
  valor,
  detalhe,
  Icone,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  Icone: LucideIcon;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {rotulo}
        </p>
        <Icone className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold leading-none">{valor}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

type FiltroStatus = "ATIVAS" | "TODAS" | "ENCERRADAS";

const inputClass =
  "min-h-11 w-full border-b border-input bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

const STATUS_ASSINATURA: Record<string, { rotulo: string; classe: string }> = {
  ATIVA: { rotulo: "Ativa", classe: "bg-secondary text-brand-strong" },
  SUSPENSA: { rotulo: "Suspensa", classe: "bg-warning/15 text-warning" },
  CANCELADA: { rotulo: "Cancelada", classe: "bg-muted text-muted-foreground" },
};

const STATUS_FATURA: Record<string, { rotulo: string; classe: string; Icone: LucideIcon }> = {
  PAGO: { rotulo: "Pago", classe: "bg-success/15 text-success", Icone: CheckCircle2 },
  PENDENTE: { rotulo: "Pendente", classe: "bg-brand-soft text-brand-strong", Icone: Clock },
  ATRASADO: { rotulo: "Atrasado", classe: "bg-danger/15 text-danger", Icone: AlertTriangle },
  CANCELADO: { rotulo: "Cancelado", classe: "bg-muted text-muted-foreground", Icone: Ban },
};

function formatarValorInput(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type ConfirmacaoFinanceiro =
  | { tipo: "assinatura"; id: string; assinante: string; novoStatus: string }
  | { tipo: "fatura"; id: string; valor: number; statusAtual: string; novoStatus: string };

function LinhaFatura({
  fatura,
  onAviso,
  onPedirConfirmacao,
}: {
  fatura: FaturaDoGestor;
  onAviso: (msg: string) => void;
  onPedirConfirmacao: (alvo: ConfirmacaoFinanceiro) => void;
}) {
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const [statusLocal, setStatusLocal] = useOptimistic(fatura.status);
  const selectId = useId();

  const estilo = STATUS_FATURA[statusLocal] ?? STATUS_FATURA.PENDENTE;
  const Icone = estilo.Icone;

  function alterar(novo: string) {
    if (novo === statusLocal) return;
    if (novo === "CANCELADO" || (statusLocal === "PAGO" && novo !== "PAGO")) {
      onPedirConfirmacao({
        tipo: "fatura",
        id: fatura.id,
        valor: fatura.valor,
        statusAtual: statusLocal,
        novoStatus: novo,
      });
      return;
    }
    setErro("");
    startTransition(async () => {
      setStatusLocal(novo);
      const res = await atualizarStatusFatura(fatura.id, novo);
      if (res.erro) setErro(res.erro);
      else if (res.ok) onAviso(res.ok);
    });
  }

  return (
    <li className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            R$ {reais(fatura.valor)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
              estilo.classe,
            )}
          >
            <Icone className="size-3" aria-hidden="true" />
            {estilo.rotulo}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Vencimento em {dataCurta(fatura.vencimento)}
          {fatura.pagamento && statusLocal === "PAGO"
            ? ` · Pago em ${dataCurta(fatura.pagamento)}`
            : ""}
        </p>
        {erro ? (
          <p role="alert" className="mt-1 text-xs text-danger">
            {erro}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusLocal === "PENDENTE" || statusLocal === "ATRASADO" ? (
          <button
            type="button"
            disabled={pendente}
            onClick={() => alterar("PAGO")}
            className="inline-flex min-h-8 items-center gap-1 rounded-sm bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Marcar pago
          </button>
        ) : null}

        <div>
          <label htmlFor={selectId} className="sr-only">
            Situação da fatura
          </label>
          <select
            id={selectId}
            value={statusLocal}
            disabled={pendente}
            onChange={(e) => alterar(e.target.value)}
            className="min-h-8 rounded-sm border border-border bg-card px-2 py-1 text-xs font-medium outline-none transition-colors focus-visible:border-brand-strong disabled:opacity-50"
          >
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>
    </li>
  );
}

function CardAssinatura({
  assinatura,
  mostrarCasa,
  proximoVencimentoIso,
  onAviso,
  onPedirConfirmacao,
}: {
  assinatura: AssinaturaDoGestor;
  mostrarCasa: boolean;
  proximoVencimentoIso: string;
  onAviso: (msg: string) => void;
  onPedirConfirmacao: (alvo: ConfirmacaoFinanceiro) => void;
}) {
  const [mostrandoNovaFatura, setMostrandoNovaFatura] = useState(false);
  const [valorFat, setValorFat] = useState(() => formatarValorInput(assinatura.planoValor));
  const [vencFat, setVencFat] = useState(proximoVencimentoIso);
  const [statusFat, setStatusFat] = useState("PENDENTE");
  const [erroStatus, setErroStatus] = useState("");
  const [alterandoStatus, startStatus] = useTransition();
  const [statusLocal, setStatusLocal] = useOptimistic(assinatura.status);

  const baseId = useId();
  const estilo = STATUS_ASSINATURA[statusLocal] ?? STATUS_ASSINATURA.ATIVA;

  const [estadoFatura, acaoFatura, salvandoFatura] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await criarFatura(prev, formData);
      if (res.ok) {
        setMostrandoNovaFatura(false);
        setValorFat(formatarValorInput(assinatura.planoValor));
        setVencFat(proximoVencimentoIso);
        setStatusFat("PENDENTE");
        onAviso(res.ok);
      }
      return res;
    },
    {},
  );

  function aoAlterarStatus(novo: string) {
    if (novo === statusLocal) return;
    if (novo === "CANCELADA") {
      onPedirConfirmacao({
        tipo: "assinatura",
        id: assinatura.id,
        assinante: assinatura.assinanteNome,
        novoStatus: novo,
      });
      return;
    }
    setErroStatus("");
    startStatus(async () => {
      setStatusLocal(novo);
      const res = await atualizarStatusAssinatura(assinatura.id, novo);
      if (res.erro) setErroStatus(res.erro);
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
            {iniciais(assinatura.assinanteNome)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">
                {assinatura.assinanteNome}
              </h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                  estilo.classe,
                )}
              >
                {estilo.rotulo}
              </span>
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {assinatura.planoNome} · R$ {reais(assinatura.planoValor)}/mês
              </span>
              {mostrarCasa ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{assinatura.casaNome}</span>
                </>
              ) : null}
            </p>

            <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {assinatura.assinanteEmail ? (
                <span className="break-all">{assinatura.assinanteEmail}</span>
              ) : null}
              <span>Início em {dataCurta(assinatura.inicio)}</span>
              {assinatura.fim ? <span>Encerrada em {dataCurta(assinatura.fim)}</span> : null}
            </p>

            {erroStatus ? (
              <p role="alert" className="mt-2 text-xs text-danger">
                {erroStatus}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label htmlFor={`${baseId}-status`} className="sr-only">
              Situação da assinatura de {assinatura.assinanteNome}
            </label>
            <select
              id={`${baseId}-status`}
              value={statusLocal}
              disabled={alterandoStatus}
              onChange={(e) => aoAlterarStatus(e.target.value)}
              className="min-h-9 rounded-sm border border-border bg-card px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:border-brand-strong disabled:opacity-50"
            >
              <option value="ATIVA">Ativa</option>
              <option value="SUSPENSA">Suspensa</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          {statusLocal !== "CANCELADA" ? (
            <button
              type="button"
              onClick={() => setMostrandoNovaFatura((v) => !v)}
              aria-expanded={mostrandoNovaFatura}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
            >
              <Receipt className="size-3.5" aria-hidden="true" />
              {mostrandoNovaFatura ? "Fechar fatura" : "Lançar fatura"}
            </button>
          ) : null}
        </div>
      </div>

      {mostrandoNovaFatura && statusLocal !== "CANCELADA" ? (
        <form
          action={acaoFatura}
          className="mt-4 space-y-4 border-t border-border pt-4"
        >
          <input type="hidden" name="assinaturaId" value={assinatura.id} />

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor={`${baseId}-valor`} className={labelClass}>
                Valor (R$) *
              </label>
              <input
                id={`${baseId}-valor`}
                name="valor"
                required
                inputMode="decimal"
                value={valorFat}
                onChange={(e) => setValorFat(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${baseId}-venc`} className={labelClass}>
                Vencimento *
              </label>
              <input
                id={`${baseId}-venc`}
                name="dataVencimento"
                type="date"
                required
                value={vencFat}
                onChange={(e) => setVencFat(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${baseId}-sit`} className={labelClass}>
                Situação inicial
              </label>
              <select
                id={`${baseId}-sit`}
                name="status"
                value={statusFat}
                onChange={(e) => setStatusFat(e.target.value)}
                className={cn(inputClass, "bg-card")}
              >
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Já pago</option>
                <option value="ATRASADO">Atrasado</option>
              </select>
            </div>
          </div>

          {estadoFatura.erro ? (
            <p
              role="alert"
              className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{estadoFatura.erro}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={salvandoFatura}
              className="inline-flex min-h-9 items-center gap-2 rounded-sm bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {salvandoFatura ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              Salvar fatura
            </button>
            <button
              type="button"
              onClick={() => setMostrandoNovaFatura(false)}
              disabled={salvandoFatura}
              className="inline-flex min-h-9 items-center rounded-sm border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 border-t border-border pt-3.5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Faturas ({assinatura.faturas.length})
        </p>

        {assinatura.faturas.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Nenhuma fatura lançada.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border/70">
            {assinatura.faturas.map((fat) => (
              <LinhaFatura
                key={fat.id}
                fatura={fat}
                onAviso={onAviso}
                onPedirConfirmacao={onPedirConfirmacao}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export default function GerenciadorFinanceiro({
  casas,
  planos,
  candidatos,
  assinaturas,
  casaInicialId,
  hojeIso,
  proximoVencimentoIso,
}: Props) {
  const casaValidaInicial =
    casaInicialId && casas.some((c) => c.id === casaInicialId) ? casaInicialId : "TODAS";

  const [filtroCasa, setFiltroCasa] = useState<string>(
    casas.length === 1 ? casas[0].id : casaValidaInicial,
  );
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("ATIVAS");
  const [busca, setBusca] = useState("");
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [casaFormId, setCasaFormId] = useState<string>(
    casaValidaInicial !== "TODAS" ? casaValidaInicial : (casas[0]?.id ?? ""),
  );
  const [usuarioNovoId, setUsuarioNovoId] = useState("");
  const [planoNovoId, setPlanoNovoId] = useState("");
  const [inicioNovo, setInicioNovo] = useState(hojeIso);
  const [vencimentoNovo, setVencimentoNovo] = useState(proximoVencimentoIso);
  const [gerarFatura, setGerarFatura] = useState(true);
  const [avisoOk, setAvisoOk] = useState("");
  const [alvoConfirmacao, setAlvoConfirmacao] = useState<ConfirmacaoFinanceiro | null>(null);
  const [erroDialogo, setErroDialogo] = useState("");
  const [confirmando, startConfirmacao] = useTransition();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarBtnRef = useRef<HTMLButtonElement>(null);

  const formId = useId();
  const buscaId = useId();
  const tituloDialogId = useId();
  const descDialogId = useId();

  const confirmandoRef = useRef(confirmando);
  useEffect(() => {
    confirmandoRef.current = confirmando;
    const dialog = dialogRef.current;
    if (dialog) dialog.setAttribute("closedby", confirmando ? "none" : "any");
  }, [confirmando]);

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
      if (!confirmandoRef.current && pressionouFora && fora(e)) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  function abrirConfirmacao(alvo: ConfirmacaoFinanceiro) {
    setErroDialogo("");
    setAvisoOk("");
    setAlvoConfirmacao(alvo);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarBtnRef.current?.focus();
    }
  }

  function executarConfirmacao() {
    if (!alvoConfirmacao) return;
    const alvo = alvoConfirmacao;
    setErroDialogo("");
    startConfirmacao(async () => {
      const res =
        alvo.tipo === "assinatura"
          ? await atualizarStatusAssinatura(alvo.id, alvo.novoStatus)
          : await atualizarStatusFatura(alvo.id, alvo.novoStatus);
      if (res.erro) {
        setErroDialogo(res.erro);
      } else {
        if (res.ok) setAvisoOk(res.ok);
        dialogRef.current?.close("confirmed");
      }
    });
  }

  const [estadoCriar, acaoCriar, criando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await criarAssinatura(prev, formData);
      if (res.ok) {
        setAvisoOk(res.ok);
        setMostrarFormNovo(false);
        setUsuarioNovoId("");
        setPlanoNovoId("");
        setInicioNovo(hojeIso);
        setVencimentoNovo(proximoVencimentoIso);
      }
      return res;
    },
    {},
  );

  const casaEfetivaForm = filtroCasa !== "TODAS" ? filtroCasa : casaFormId;
  const planosDaCasaForm = useMemo(
    () => planos.filter((p) => p.casaId === casaEfetivaForm && p.ativo),
    [planos, casaEfetivaForm],
  );
  const candidatosDaCasaForm = useMemo(
    () => candidatos.filter((c) => c.casaId === casaEfetivaForm),
    [candidatos, casaEfetivaForm],
  );

  const planoEfetivoId = planosDaCasaForm.some((p) => p.id === planoNovoId)
    ? planoNovoId
    : (planosDaCasaForm[0]?.id ?? "");
  const usuarioEfetivoId = candidatosDaCasaForm.some(
    (c) => c.usuarioId === usuarioNovoId && !c.jaTemAssinaturaAtiva,
  )
    ? usuarioNovoId
    : "";

  const assinaturasDaCasa = useMemo(
    () =>
      filtroCasa === "TODAS"
        ? assinaturas
        : assinaturas.filter((a) => a.casaId === filtroCasa),
    [assinaturas, filtroCasa],
  );

  const resumoFiltrado = useMemo(() => {
    let assinaturasAtivas = 0;
    let receitaMensal = 0;
    let totalPago = 0;
    let totalEmAberto = 0;
    let faturasAtrasadas = 0;

    for (const a of assinaturasDaCasa) {
      if (a.status === "ATIVA") {
        assinaturasAtivas += 1;
        receitaMensal += a.planoValor;
      }
      for (const f of a.faturas) {
        if (f.status === "PAGO") totalPago += f.valor;
        if (f.status === "PENDENTE" || f.status === "ATRASADO") totalEmAberto += f.valor;
        if (f.status === "ATRASADO") faturasAtrasadas += 1;
      }
    }

    return { assinaturasAtivas, receitaMensal, totalPago, totalEmAberto, faturasAtrasadas };
  }, [assinaturasDaCasa]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return assinaturasDaCasa.filter((a) => {
      if (filtroStatus === "ATIVAS" && a.status !== "ATIVA") return false;
      if (filtroStatus === "ENCERRADAS" && a.status === "ATIVA") return false;
      if (
        termo &&
        !a.assinanteNome.toLowerCase().includes(termo) &&
        !a.assinanteEmail.toLowerCase().includes(termo) &&
        !a.planoNome.toLowerCase().includes(termo)
      ) {
        return false;
      }
      return true;
    });
  }, [assinaturasDaCasa, filtroStatus, busca]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatFinanceiro
          rotulo="Assinaturas ativas"
          valor={String(resumoFiltrado.assinaturasAtivas)}
          detalhe="Famílias com plano ativo"
          Icone={Users}
        />
        <StatFinanceiro
          rotulo="Receita mensal"
          valor={`R$ ${reais(resumoFiltrado.receitaMensal)}`}
          detalhe="Soma dos planos ativos"
          Icone={Wallet}
        />
        <StatFinanceiro
          rotulo="Em aberto"
          valor={`R$ ${reais(resumoFiltrado.totalEmAberto)}`}
          detalhe={
            resumoFiltrado.faturasAtrasadas > 0
              ? `${resumoFiltrado.faturasAtrasadas} fatura${resumoFiltrado.faturasAtrasadas === 1 ? "" : "s"} em atraso`
              : "Pendentes de pagamento"
          }
          Icone={Clock}
        />
        <StatFinanceiro
          rotulo="Total recebido"
          valor={`R$ ${reais(resumoFiltrado.totalPago)}`}
          detalhe="Faturas marcadas como pagas"
          Icone={CheckCircle2}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {casas.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar financeiro por casa">
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
                {assinaturas.length}
              </span>
            </button>

            {casas.map((casa) => {
              const qtd = assinaturas.filter((a) => a.casaId === casa.id).length;
              const ativo = filtroCasa === casa.id;
              return (
                <button
                  key={casa.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => {
                    setFiltroCasa(casa.id);
                    setCasaFormId(casa.id);
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
              Nova assinatura
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
            Nova assinatura
          </h2>

          <form
            aria-labelledby={`${formId}-titulo`}
            action={acaoCriar}
            className="mt-5 space-y-5"
          >
            {casas.length > 1 && filtroCasa === "TODAS" ? (
              <div>
                <label htmlFor={`${formId}-casa`} className={labelClass}>
                  Casa *
                </label>
                <select
                  id={`${formId}-casa`}
                  value={casaFormId}
                  onChange={(e) => {
                    setCasaFormId(e.target.value);
                    setUsuarioNovoId("");
                    setPlanoNovoId("");
                  }}
                  className={cn(inputClass, "bg-card")}
                >
                  {casas.map((casa) => (
                    <option key={casa.id} value={casa.id}>
                      {casa.nome}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {planosDaCasaForm.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta casa não tem planos ativos.{" "}
                <Link
                  href={`/gerente/planos?casa=${casaEfetivaForm}`}
                  className="font-medium text-brand-strong hover:underline"
                >
                  Cadastrar plano
                </Link>
              </p>
            ) : candidatosDaCasaForm.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum familiar vinculado ou solicitante nesta casa ainda.{" "}
                <Link
                  href={`/gerente/residentes?casa=${casaEfetivaForm}`}
                  className="font-medium text-brand-strong hover:underline"
                >
                  Gerenciar residentes
                </Link>
              </p>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${formId}-usuario`} className={labelClass}>
                      Familiar assinante *
                    </label>
                    <select
                      id={`${formId}-usuario`}
                      name="usuarioId"
                      required
                      value={usuarioEfetivoId}
                      onChange={(e) => setUsuarioNovoId(e.target.value)}
                      className={cn(inputClass, "bg-card")}
                    >
                      <option value="" disabled>
                        Selecione o familiar...
                      </option>
                      {candidatosDaCasaForm.map((c) => (
                        <option
                          key={c.usuarioId}
                          value={c.usuarioId}
                          disabled={c.jaTemAssinaturaAtiva}
                        >
                          {c.nome} ({c.email})
                          {c.jaTemAssinaturaAtiva ? " · já tem assinatura ativa" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`${formId}-plano`} className={labelClass}>
                      Plano *
                    </label>
                    <select
                      id={`${formId}-plano`}
                      name="planoId"
                      required
                      value={planoEfetivoId}
                      onChange={(e) => setPlanoNovoId(e.target.value)}
                      className={cn(inputClass, "bg-card")}
                    >
                      {planosDaCasaForm.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} — R$ {reais(p.valor)}/mês
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`${formId}-inicio`} className={labelClass}>
                      Data de início *
                    </label>
                    <input
                      id={`${formId}-inicio`}
                      name="dataInicio"
                      type="date"
                      required
                      value={inicioNovo}
                      onChange={(e) => setInicioNovo(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {gerarFatura ? (
                    <div>
                      <label htmlFor={`${formId}-venc`} className={labelClass}>
                        Vencimento da 1ª fatura *
                      </label>
                      <input
                        id={`${formId}-venc`}
                        name="dataVencimento"
                        type="date"
                        required
                        value={vencimentoNovo}
                        onChange={(e) => setVencimentoNovo(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  ) : null}
                </div>

                <label
                  htmlFor={`${formId}-gerar`}
                  className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none"
                >
                  <input
                    id={`${formId}-gerar`}
                    name="gerarPrimeiraFatura"
                    type="checkbox"
                    checked={gerarFatura}
                    onChange={(e) => setGerarFatura(e.target.checked)}
                    style={{ accentColor: "var(--primary)" }}
                    className="size-4 cursor-pointer"
                  />
                  <span>Já lançar a primeira fatura mensal</span>
                </label>

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
                    {criando ? "Criando..." : "Criar assinatura"}
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
              </>
            )}
          </form>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar assinaturas">
          {(
            [
              { valor: "ATIVAS", rotulo: "Ativas" },
              { valor: "TODAS", rotulo: "Todas" },
              { valor: "ENCERRADAS", rotulo: "Suspensas / Canceladas" },
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
            Buscar assinante ou plano
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
            placeholder="Buscar assinante ou plano..."
            autoCorrect="off"
            spellCheck={false}
            className="min-h-10 w-full border-b border-input bg-transparent py-1.5 pl-6 pr-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm"
          />
        </search>
      </div>

      <p aria-live="polite" className="sr-only">
        {visiveis.length === 1
          ? "Mostrando 1 assinatura."
          : `Mostrando ${visiveis.length} assinaturas.`}
      </p>

      {visiveis.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Wallet className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-base font-semibold">
            {assinaturasDaCasa.length === 0
              ? "Nenhuma assinatura cadastrada"
              : "Nenhuma assinatura encontrada"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {assinaturasDaCasa.length === 0
              ? "Vincule um familiar a um plano para acompanhar mensalidades e controlar pagamentos."
              : "Tente limpar a busca ou trocar o filtro de situação."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((assinatura) => (
            <CardAssinatura
              key={assinatura.id}
              assinatura={assinatura}
              mostrarCasa={filtroCasa === "TODAS" && casas.length > 1}
              proximoVencimentoIso={proximoVencimentoIso}
              onAviso={setAvisoOk}
              onPedirConfirmacao={abrirConfirmacao}
            />
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloDialogId}
        aria-describedby={descDialogId}
        onCancel={(e) => {
          if (confirmando) e.preventDefault();
        }}
        onClose={(e) => {
          e.currentTarget.returnValue = "";
          setAlvoConfirmacao(null);
          setErroDialogo("");
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={tituloDialogId} className="font-heading text-lg font-semibold">
              {alvoConfirmacao?.tipo === "assinatura"
                ? "Cancelar assinatura?"
                : alvoConfirmacao?.novoStatus === "CANCELADO"
                  ? "Cancelar fatura?"
                  : "Reverter pagamento da fatura?"}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={confirmando}
              aria-label="Fechar janela"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p id={descDialogId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {alvoConfirmacao?.tipo === "assinatura" ? (
              <>
                A assinatura de{" "}
                <span className="font-semibold text-foreground">{alvoConfirmacao.assinante}</span>{" "}
                será encerrada na data de hoje e deixará de contar na receita mensal ativa.
              </>
            ) : alvoConfirmacao?.novoStatus === "CANCELADO" ? (
              <>
                A fatura de{" "}
                <span className="font-semibold text-foreground">
                  R$ {reais(alvoConfirmacao.valor)}
                </span>{" "}
                será marcada como cancelada e sairá dos valores em aberto/recebidos.
              </>
            ) : alvoConfirmacao ? (
              <>
                A fatura de{" "}
                <span className="font-semibold text-foreground">
                  R$ {reais(alvoConfirmacao.valor)}
                </span>{" "}
                perderá a data de pagamento registrada ao deixar a situação &ldquo;Pago&rdquo;.
              </>
            ) : null}
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
              disabled={confirmando}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={executarConfirmacao}
              disabled={confirmando || !alvoConfirmacao}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {confirmando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {confirmando ? "Salvando..." : "Confirmar alteração"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
