"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Mail, Phone, UserCheck, XCircle } from "lucide-react";
import { responderSolicitacaoEquipe } from "@/lib/funcionario/actions";
import type { AprovacoesDoFuncionario, SolicitacaoEquipe } from "@/lib/funcionario/dados";
import { dataHora, rotuloStatusAdesao } from "@/lib/painel/formato";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: "bg-warning/15 text-warning",
  APROVADA: "bg-success/15 text-success",
  RECUSADA: "bg-danger/15 text-danger",
  CANCELADA: "bg-muted text-muted-foreground",
};

export default function CentralAprovacoes({ dados }: { dados: AprovacoesDoFuncionario }) {
  const baseId = useId();
  const [filtroCasa, setFiltroCasa] = useState("TODAS");
  const [filtroStatus, setFiltroStatus] = useState<"PENDENTES" | "TODAS">("PENDENTES");
  const [avisoOk, setAvisoOk] = useState("");
  const [erroGeral, setErroGeral] = useState("");

  // Modal de aprovação (com vínculo opcional) ou recusa
  const [alvo, setAlvo] = useState<{
    modo: "APROVADA" | "RECUSADA";
    solicitacao: SolicitacaoEquipe;
  } | null>(null);
  const [residenteId, setResidenteId] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [principal, setPrincipal] = useState(true);
  const [erroDialog, setErroDialog] = useState("");
  const [salvando, startSalvar] = useTransition();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const salvandoRef = useRef(false);
  const dialogTituloId = useId();

  useEffect(() => {
    salvandoRef.current = salvando;
    const dialog = dialogRef.current;
    if (dialog) dialog.setAttribute("closedby", salvando ? "none" : "any");
  }, [salvando]);

  const pendentesCount = useMemo(
    () => dados.solicitacoes.filter((s) => s.status === "PENDENTE").length,
    [dados.solicitacoes],
  );

  const visiveis = useMemo(() => {
    return dados.solicitacoes.filter((s) => {
      if (filtroCasa !== "TODAS" && s.casaId !== filtroCasa) return false;
      if (filtroStatus === "PENDENTES" && s.status !== "PENDENTE") return false;
      return true;
    });
  }, [dados.solicitacoes, filtroCasa, filtroStatus]);

  const residentesDaCasaAlvo = useMemo(() => {
    if (!alvo) return [];
    return dados.residentesAtivos.filter((r) => r.casaId === alvo.solicitacao.casaId);
  }, [dados.residentesAtivos, alvo]);

  function abrirModal(modo: "APROVADA" | "RECUSADA", solicitacao: SolicitacaoEquipe) {
    setErroDialog("");
    setErroGeral("");
    setAvisoOk("");
    setResidenteId("");
    setParentesco("");
    setPrincipal(true);
    setAlvo({ modo, solicitacao });

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarRef.current?.focus();
    }
  }

  function confirmarAcao() {
    if (!alvo) return;
    setErroDialog("");

    startSalvar(async () => {
      const res = await responderSolicitacaoEquipe({
        idAdesao: alvo.solicitacao.id,
        decisao: alvo.modo,
        residenteId: alvo.modo === "APROVADA" ? residenteId : undefined,
        parentesco: alvo.modo === "APROVADA" && residenteId ? parentesco : undefined,
        responsavelPrincipal: alvo.modo === "APROVADA" && residenteId ? principal : undefined,
      });

      if (res.erro) {
        setErroDialog(res.erro);
        return;
      }

      setAvisoOk(res.ok ?? "Solicitação atualizada.");
      dialogRef.current?.close();
      setAlvo(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar solicitações por status">
          <button
            type="button"
            aria-pressed={filtroStatus === "PENDENTES"}
            onClick={() => setFiltroStatus("PENDENTES")}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              filtroStatus === "PENDENTES"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            Pendentes
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                filtroStatus === "PENDENTES"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {pendentesCount}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={filtroStatus === "TODAS"}
            onClick={() => setFiltroStatus("TODAS")}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              filtroStatus === "TODAS"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            Todas
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                filtroStatus === "TODAS"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {dados.solicitacoes.length}
            </span>
          </button>
        </div>

        {dados.casas.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por casa">
            <button
              type="button"
              aria-pressed={filtroCasa === "TODAS"}
              onClick={() => setFiltroCasa("TODAS")}
              className={cn(
                "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                filtroCasa === "TODAS"
                  ? "bg-secondary text-brand-strong"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary/60",
              )}
            >
              Todas as casas
            </button>
            {dados.casas.map((casa) => (
              <button
                key={casa.casaId}
                type="button"
                aria-pressed={filtroCasa === casa.casaId}
                onClick={() => setFiltroCasa(casa.casaId)}
                className={cn(
                  "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  filtroCasa === casa.casaId
                    ? "bg-secondary text-brand-strong"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {casa.casaNome}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {avisoOk ? (
        <p role="status" className="rounded-sm border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          {avisoOk}
        </p>
      ) : null}
      {erroGeral ? (
        <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {erroGeral}
        </p>
      ) : null}

      {visiveis.length === 0 ? (
        <section className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <UserCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-base font-semibold">
            {filtroStatus === "PENDENTES"
              ? "Nenhuma solicitação pendente"
              : "Nenhuma solicitação registrada"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtroStatus === "PENDENTES"
              ? "Quando um familiar pedir entrada na instituição pelo portal, o pedido aparecerá aqui para análise."
              : "Não há pedidos de entrada registrados para o filtro atual."}
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((s) => (
            <li
              key={s.id}
              className="flex flex-col justify-between gap-4 rounded-sm border border-border bg-card p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    {s.solicitanteNome}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider",
                      STATUS_BADGE[s.status] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {rotuloStatusAdesao(s.status)}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {dados.casas.length > 1 ? (
                    <span className="font-medium text-foreground">{s.casaNome}</span>
                  ) : null}
                  {s.solicitanteEmail ? (
                    <a
                      href={`mailto:${s.solicitanteEmail}`}
                      className="inline-flex items-center gap-1 break-all hover:text-foreground"
                    >
                      <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                      {s.solicitanteEmail}
                    </a>
                  ) : null}
                  {s.solicitanteTelefone ? (
                    <a
                      href={`tel:${s.solicitanteTelefone}`}
                      className="inline-flex items-center gap-1 font-medium text-brand-strong hover:underline"
                    >
                      <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                      {formatarTelefone(s.solicitanteTelefone)}
                    </a>
                  ) : null}
                </div>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  Enviada em {dataHora(s.quando)}
                  {s.respondidaEm ? ` · respondida em ${dataHora(s.respondidaEm)}` : ""}
                </p>
              </div>

              {s.status === "PENDENTE" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => abrirModal("APROVADA", s)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirModal("RECUSADA", s)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-danger"
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    Recusar
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTituloId}
        onCancel={(e) => {
          if (salvandoRef.current) e.preventDefault();
        }}
        onClose={() => {
          if (!salvandoRef.current) setAlvo(null);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <h3 id={dialogTituloId} className="font-heading text-lg font-semibold">
            {alvo?.modo === "APROVADA" ? "Aprovar solicitação" : "Recusar solicitação"}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {alvo?.modo === "APROVADA" ? (
              <>
                Confirme a aprovação de{" "}
                <strong className="font-medium text-foreground">
                  {alvo.solicitacao.solicitanteNome}
                </strong>{" "}
                em {alvo.solicitacao.casaNome}. Você pode vincular o familiar a um residente agora
                ou deixar para depois.
              </>
            ) : (
              <>
                Tem certeza que deseja recusar a solicitação de{" "}
                <strong className="font-medium text-foreground">
                  {alvo?.solicitacao.solicitanteNome}
                </strong>
                ?
              </>
            )}
          </p>

          {alvo?.modo === "APROVADA" && residentesDaCasaAlvo.length > 0 ? (
            <div className="mt-4 space-y-4 rounded-sm border border-border bg-background/60 p-4">
              <div>
                <label
                  htmlFor={`${baseId}-residente`}
                  className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Vincular ao residente (opcional)
                </label>
                <select
                  id={`${baseId}-residente`}
                  value={residenteId}
                  onChange={(e) => setResidenteId(e.target.value)}
                  className="mt-1 w-full border-b border-input bg-transparent py-2 text-base text-foreground outline-none focus:border-brand-strong sm:text-sm"
                >
                  <option value="" className="bg-card">
                    Aprovar sem vincular agora
                  </option>
                  {residentesDaCasaAlvo.map((r) => (
                    <option key={r.id} value={r.id} className="bg-card">
                      {r.nome}
                    </option>
                  ))}
                </select>
              </div>

              {residenteId ? (
                <>
                  <div>
                    <label
                      htmlFor={`${baseId}-parentesco`}
                      className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      Parentesco *
                    </label>
                    <input
                      id={`${baseId}-parentesco`}
                      type="text"
                      value={parentesco}
                      onChange={(e) => setParentesco(e.target.value)}
                      placeholder="Ex.: Filha, Neto, Sobrinho..."
                      maxLength={60}
                      className="mt-1 w-full border-b border-input bg-transparent py-2 text-base text-foreground outline-none focus:border-brand-strong sm:text-sm"
                    />
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={principal}
                      onChange={(e) => setPrincipal(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    Responsável principal
                  </label>
                </>
              ) : null}
            </div>
          ) : null}

          {erroDialog ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {erroDialog}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <button
              ref={cancelarRef}
              type="button"
              disabled={salvando}
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={confirmarAcao}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60",
                alvo?.modo === "RECUSADA"
                  ? "bg-danger text-danger-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {salvando ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Salvando...
                </>
              ) : alvo?.modo === "APROVADA" ? (
                "Confirmar aprovação"
              ) : (
                "Recusar pedido"
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
