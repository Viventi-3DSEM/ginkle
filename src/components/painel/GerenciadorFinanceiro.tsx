"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useOptimistic, useState, useTransition } from "react";
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
  hojeIso: string;
  proximoVencimentoIso: string;
};

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

function LinhaFatura({
  fatura,
  onAviso,
}: {
  fatura: FaturaDoGestor;
  onAviso: (msg: string) => void;
}) {
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const [statusLocal, setStatusLocal] = useOptimistic(fatura.status);
  const selectId = useId();

  const estilo = STATUS_FATURA[statusLocal] ?? STATUS_FATURA.PENDENTE;
  const Icone = estilo.Icone;

  function alterar(novo: string) {
    if (novo === statusLocal) return;
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
}: {
  assinatura: AssinaturaDoGestor;
  mostrarCasa: boolean;
  proximoVencimentoIso: string;
  onAviso: (msg: string) => void;
}) {
  const [mostrandoNovaFatura, setMostrandoNovaFatura] = useState(false);
  const [formFatKey, setFormFatKey] = useState(0);
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
        setFormFatKey((k) => k + 1);
        onAviso(res.ok);
      }
      return res;
    },
    {},
  );

  function aoAlterarStatus(novo: string) {
    if (novo === statusLocal) return;
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

          <button
            type="button"
            onClick={() => setMostrandoNovaFatura((v) => !v)}
            aria-expanded={mostrandoNovaFatura}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Receipt className="size-3.5" aria-hidden="true" />
            {mostrandoNovaFatura ? "Fechar fatura" : "Lançar fatura"}
          </button>
        </div>
      </div>

      {mostrandoNovaFatura ? (
        <form
          key={formFatKey}
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
                defaultValue={formatarValorInput(assinatura.planoValor)}
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
                defaultValue={proximoVencimentoIso}
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
                defaultValue="PENDENTE"
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
              <LinhaFatura key={fat.id} fatura={fat} onAviso={onAviso} />
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
  hojeIso,
  proximoVencimentoIso,
}: Props) {
  const [filtroCasa, setFiltroCasa] = useState<string>(
    casas.length === 1 ? casas[0].id : "TODAS",
  );
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("ATIVAS");
  const [busca, setBusca] = useState("");
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [casaFormId, setCasaFormId] = useState<string>(casas[0]?.id ?? "");
  const [gerarFatura, setGerarFatura] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [avisoOk, setAvisoOk] = useState("");

  const formId = useId();
  const buscaId = useId();

  const [estadoCriar, acaoCriar, criando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await criarAssinatura(prev, formData);
      if (res.ok) {
        setAvisoOk(res.ok);
        setMostrarFormNovo(false);
        setFormKey((k) => k + 1);
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

  const assinaturasDaCasa = useMemo(
    () =>
      filtroCasa === "TODAS"
        ? assinaturas
        : assinaturas.filter((a) => a.casaId === filtroCasa),
    [assinaturas, filtroCasa],
  );

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
            key={`${formKey}-${casaEfetivaForm}`}
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
                  onChange={(e) => setCasaFormId(e.target.value)}
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
                      defaultValue=""
                      className={cn(inputClass, "bg-card")}
                    >
                      <option value="" disabled>
                        Selecione o familiar...
                      </option>
                      {candidatosDaCasaForm.map((c) => (
                        <option key={c.usuarioId} value={c.usuarioId}>
                          {c.nome} ({c.email})
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
                      defaultValue={planosDaCasaForm[0]?.id ?? ""}
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
                      defaultValue={hojeIso}
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
                        defaultValue={proximoVencimentoIso}
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
            />
          ))}
        </ul>
      )}
    </div>
  );
}
