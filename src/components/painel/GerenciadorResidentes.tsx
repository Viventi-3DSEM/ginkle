"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  atualizarResidente,
  criarResidente,
  removerFamiliar,
  responderSolicitacao,
  vincularFamiliar,
  type Estado,
} from "@/lib/painel/actions";
import type {
  FamiliarDoResidente,
  ResidenteDoGestor,
  SolicitacaoDoGestor,
} from "@/lib/painel/dados";
import {
  dataCurta,
  dataHora,
  idade,
  iniciais,
  rotuloSexo,
  rotuloStatusResidente,
} from "@/lib/painel/formato";
import { formatarCpf } from "@/lib/validacao/cpf";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { cn } from "@/lib/utils";

type CasaResumo = {
  id: string;
  nome: string;
  slug: string;
};

type Props = {
  casas: CasaResumo[];
  residentes: ResidenteDoGestor[];
  solicitacoes: SolicitacaoDoGestor[];
  casaInicialId?: string;
  hojeIso: string;
};

type FiltroStatus = "ATIVOS" | "TODOS" | "INATIVOS";

const inputClass =
  "min-h-11 w-full border-b border-input bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

function classeStatusResidente(status: string): string {
  if (status === "ATIVO") return "bg-secondary text-brand-strong";
  if (status === "ALTA") return "bg-info/15 text-info";
  return "bg-muted text-muted-foreground";
}

function CardSolicitacaoPendente({
  solicitacao,
  residentesDaCasa,
  mostrarCasa,
  onAviso,
  onPedirRecusa,
}: {
  solicitacao: SolicitacaoDoGestor;
  residentesDaCasa: ResidenteDoGestor[];
  mostrarCasa: boolean;
  onAviso: (msg: string) => void;
  onPedirRecusa: (s: SolicitacaoDoGestor) => void;
}) {
  const [aprovando, setAprovando] = useState(false);
  const [residenteEscolhido, setResidenteEscolhido] = useState("");
  const [parentescoAprov, setParentescoAprov] = useState("");
  const [respAprov, setRespAprov] = useState(false);
  const resId = useId();
  const parId = useId();
  const respId = useId();

  const [estado, acao, enviando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await responderSolicitacao(prev, formData);
      if (res.ok) {
        setAprovando(false);
        setResidenteEscolhido("");
        setParentescoAprov("");
        setRespAprov(false);
        onAviso(res.ok);
      }
      return res;
    },
    {},
  );

  return (
    <li className="rounded-sm border border-border bg-background/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-sm font-semibold text-foreground">
              {solicitacao.solicitanteNome}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
              <Clock className="size-3" aria-hidden="true" />
              Pendente
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {mostrarCasa ? <span className="font-medium text-foreground">{solicitacao.casaNome}</span> : null}
            {solicitacao.solicitanteEmail ? (
              <span className="inline-flex items-center gap-1 break-all">
                <Mail className="size-3 shrink-0" aria-hidden="true" />
                {solicitacao.solicitanteEmail}
              </span>
            ) : null}
            {solicitacao.solicitanteTelefone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3 shrink-0" aria-hidden="true" />
                {formatarTelefone(solicitacao.solicitanteTelefone)}
              </span>
            ) : null}
            <span>
              Pedido em <time dateTime={solicitacao.quando}>{dataHora(solicitacao.quando)}</time>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAprovando((v) => !v)}
            aria-expanded={aprovando}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Aprovar
          </button>
          <button
            type="button"
            onClick={() => onPedirRecusa(solicitacao)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:border-danger/60 hover:bg-danger/10"
          >
            <X className="size-3.5" aria-hidden="true" />
            Recusar
          </button>
        </div>
      </div>

      {aprovando ? (
        <form action={acao} className="mt-4 space-y-4 border-t border-border pt-4">
          <input type="hidden" name="id" value={solicitacao.id} />
          <input type="hidden" name="casaId" value={solicitacao.casaId} />
          <input type="hidden" name="decisao" value="APROVADA" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={resId} className={labelClass}>
                Vincular a um residente (opcional)
              </label>
              <select
                id={resId}
                name="residenteId"
                value={residenteEscolhido}
                onChange={(e) => setResidenteEscolhido(e.target.value)}
                className={cn(inputClass, "bg-card")}
              >
                <option value="">Aprovar sem vincular agora</option>
                {residentesDaCasa.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome} ({rotuloStatusResidente(r.status)})
                  </option>
                ))}
              </select>
            </div>

            {residenteEscolhido ? (
              <div>
                <label htmlFor={parId} className={labelClass}>
                  Parentesco *
                </label>
                <input
                  id={parId}
                  name="parentesco"
                  required
                  maxLength={60}
                  value={parentescoAprov}
                  onChange={(e) => setParentescoAprov(e.target.value)}
                  placeholder="Ex.: Filha, Filho, Sobrinho"
                  className={inputClass}
                />
              </div>
            ) : null}
          </div>

          {residenteEscolhido ? (
            <label
              htmlFor={respId}
              className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none"
            >
              <input
                id={respId}
                name="responsavelPrincipal"
                type="checkbox"
                checked={respAprov}
                onChange={(e) => setRespAprov(e.target.checked)}
                style={{ accentColor: "var(--primary)" }}
                className="size-4 cursor-pointer"
              />
              <span>Definir como responsável principal</span>
            </label>
          ) : null}

          {estado.erro ? (
            <p role="alert" className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{estado.erro}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              {enviando ? "Confirmando..." : "Confirmar aprovação"}
            </button>
            <button
              type="button"
              onClick={() => setAprovando(false)}
              disabled={enviando}
              className="inline-flex min-h-10 items-center rounded-sm border border-border bg-card px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

function CardResidente({
  residente,
  mostrarCasa,
  onAviso,
  onPedirRemoverFamiliar,
}: {
  residente: ResidenteDoGestor;
  mostrarCasa: boolean;
  onAviso: (msg: string) => void;
  onPedirRemoverFamiliar: (residente: ResidenteDoGestor, familiar: FamiliarDoResidente) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(residente.nome);
  const [cpfEdit, setCpfEdit] = useState(() => formatarCpf(residente.cpf));
  const [statusEdit, setStatusEdit] = useState(residente.status);
  const [nascEdit, setNascEdit] = useState(residente.nascimento);
  const [sexoEdit, setSexoEdit] = useState(residente.sexo);
  const [ingEdit, setIngEdit] = useState(residente.ingresso);
  const [obsEdit, setObsEdit] = useState(residente.observacoesMedicas ?? "");
  const [emailFam, setEmailFam] = useState("");
  const [parentescoFam, setParentescoFam] = useState("");
  const [respFam, setRespFam] = useState(false);

  const anos = idade(residente.nascimento);

  const [estadoEditar, acaoEditar, salvando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await atualizarResidente(prev, formData);
      if (res.ok) {
        setEditando(false);
        onAviso(res.ok);
      }
      return res;
    },
    {},
  );

  const [estadoVincular, acaoVincular, enviandoFam] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await vincularFamiliar(prev, formData);
      if (res.ok) {
        setVinculando(false);
        setEmailFam("");
        setParentescoFam("");
        setRespFam(false);
        onAviso(res.ok);
      }
      return res;
    },
    {},
  );

  const baseId = useId();

  return (
    <li className="rounded-sm border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-sm font-bold text-brand-strong"
          >
            {iniciais(residente.nome)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">{residente.nome}</h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                  classeStatusResidente(residente.status),
                )}
              >
                {rotuloStatusResidente(residente.status)}
              </span>
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {mostrarCasa ? (
                <>
                  <span className="font-medium text-foreground">{residente.casaNome}</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              {anos !== null ? (
                <>
                  <span>{anos} anos</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <span>{rotuloSexo(residente.sexo)}</span>
              <span aria-hidden="true">·</span>
              <span>Ingresso em {dataCurta(residente.ingresso)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setVinculando(false);
              setNomeEdit(residente.nome);
              setCpfEdit(formatarCpf(residente.cpf));
              setStatusEdit(residente.status);
              setNascEdit(residente.nascimento);
              setSexoEdit(residente.sexo);
              setIngEdit(residente.ingresso);
              setObsEdit(residente.observacoesMedicas ?? "");
              setEditando((v) => !v);
            }}
            aria-expanded={editando}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            {editando ? "Fechar ficha" : "Editar ficha"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditando(false);
              setVinculando((v) => !v);
            }}
            aria-expanded={vinculando}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <UserPlus className="size-3.5" aria-hidden="true" />
            Vincular familiar
          </button>
        </div>
      </div>

      {residente.observacoesMedicas && !editando ? (
        <p className="mt-3 rounded-sm border border-border/70 bg-background/60 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Observações médicas: </span>
          {residente.observacoesMedicas}
        </p>
      ) : null}

      {editando ? (
        <form action={acaoEditar} className="mt-5 space-y-4 border-t border-border pt-5">
          <input type="hidden" name="id" value={residente.id} />
          <input type="hidden" name="casaId" value={residente.casaId} />
          <input type="hidden" name="cpfAtual" value={residente.cpf} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`${baseId}-nome`} className={labelClass}>
                Nome completo *
              </label>
              <input
                id={`${baseId}-nome`}
                name="nome"
                required
                maxLength={120}
                value={nomeEdit}
                onChange={(e) => setNomeEdit(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${baseId}-cpf`} className={labelClass}>
                CPF *
              </label>
              <input
                id={`${baseId}-cpf`}
                name="cpf"
                required
                inputMode="numeric"
                maxLength={14}
                value={cpfEdit}
                onChange={(e) => setCpfEdit(formatarCpf(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${baseId}-status`} className={labelClass}>
                Situação *
              </label>
              <select
                id={`${baseId}-status`}
                name="status"
                value={statusEdit}
                onChange={(e) => setStatusEdit(e.target.value)}
                className={cn(inputClass, "bg-card")}
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="ALTA">Alta</option>
                <option value="OBITO">Óbito</option>
              </select>
            </div>

            <div>
              <label htmlFor={`${baseId}-nasc`} className={labelClass}>
                Data de nascimento *
              </label>
              <input
                id={`${baseId}-nasc`}
                name="nascimento"
                type="date"
                required
                value={nascEdit}
                onChange={(e) => setNascEdit(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${baseId}-sexo`} className={labelClass}>
                Sexo *
              </label>
              <select
                id={`${baseId}-sexo`}
                name="sexo"
                value={sexoEdit}
                onChange={(e) => setSexoEdit(e.target.value)}
                className={cn(inputClass, "bg-card")}
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor={`${baseId}-ing`} className={labelClass}>
                Data de ingresso *
              </label>
              <input
                id={`${baseId}-ing`}
                name="ingresso"
                type="date"
                required
                value={ingEdit}
                onChange={(e) => setIngEdit(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={`${baseId}-obs`} className={labelClass}>
                Observações médicas (opcional)
              </label>
              <textarea
                id={`${baseId}-obs`}
                name="observacoesMedicas"
                rows={3}
                maxLength={2000}
                value={obsEdit}
                onChange={(e) => setObsEdit(e.target.value)}
                placeholder="Alergias, medicamentos contínuos, restrições alimentares."
                className={cn(inputClass, "resize-y")}
              />
            </div>
          </div>

          {estadoEditar.erro ? (
            <p role="alert" className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger">
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
              Salvar alterações
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
      ) : null}

      {vinculando ? (
        <form
          action={acaoVincular}
          className="mt-5 space-y-4 border-t border-border pt-5"
        >
          <input type="hidden" name="residenteId" value={residente.id} />
          <input type="hidden" name="casaId" value={residente.casaId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${baseId}-fam-email`} className={labelClass}>
                E-mail da conta do familiar *
              </label>
              <input
                id={`${baseId}-fam-email`}
                name="email"
                type="email"
                required
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={emailFam}
                onChange={(e) => setEmailFam(e.target.value)}
                placeholder="familiar@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`${baseId}-fam-par`} className={labelClass}>
                Parentesco *
              </label>
              <input
                id={`${baseId}-fam-par`}
                name="parentesco"
                required
                maxLength={60}
                value={parentescoFam}
                onChange={(e) => setParentescoFam(e.target.value)}
                placeholder="Ex.: Filha, Neto, Cônjuge"
                className={inputClass}
              />
            </div>
          </div>

          <label
            htmlFor={`${baseId}-fam-resp`}
            className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none"
          >
            <input
              id={`${baseId}-fam-resp`}
              name="responsavelPrincipal"
              type="checkbox"
              checked={respFam}
              onChange={(e) => setRespFam(e.target.checked)}
              style={{ accentColor: "var(--primary)" }}
              className="size-4 cursor-pointer"
            />
            <span>Responsável principal</span>
          </label>

          {estadoVincular.erro ? (
            <p role="alert" className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{estadoVincular.erro}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={enviandoFam}
              className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviandoFam ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Vincular
            </button>
            <button
              type="button"
              onClick={() => setVinculando(false)}
              disabled={enviandoFam}
              className="inline-flex min-h-10 items-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 border-t border-border pt-3.5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Familiares vinculados ({residente.familiares.length})
        </p>

        {residente.familiares.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Nenhum familiar vinculado.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border/70">
            {residente.familiares.map((fam) => (
              <li
                key={fam.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{fam.nome}</span>
                    <span className="text-xs text-muted-foreground">· {fam.parentesco}</span>
                    {fam.responsavelPrincipal ? (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
                        Principal
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {fam.email ? <span className="break-all">{fam.email}</span> : null}
                    {fam.telefone ? <span>{formatarTelefone(fam.telefone)}</span> : null}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onPedirRemoverFamiliar(residente, fam)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:border-danger/60 hover:bg-danger/10"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

type ModalAlvo =
  | { tipo: "familiar"; residente: ResidenteDoGestor; familiar: FamiliarDoResidente }
  | { tipo: "recusa"; solicitacao: SolicitacaoDoGestor };

export default function GerenciadorResidentes({
  casas,
  residentes,
  solicitacoes,
  casaInicialId,
  hojeIso,
}: Props) {
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
  const [nomeNovo, setNomeNovo] = useState("");
  const [cpfNovo, setCpfNovo] = useState("");
  const [sexoNovo, setSexoNovo] = useState("F");
  const [nascNovo, setNascNovo] = useState("");
  const [ingNovo, setIngNovo] = useState(hojeIso);
  const [obsNova, setObsNova] = useState("");
  const [avisoOk, setAvisoOk] = useState("");
  const [alvoModal, setAlvoModal] = useState<ModalAlvo | null>(null);
  const [erroDialogo, setErroDialogo] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarBtnRef = useRef<HTMLButtonElement>(null);

  const formId = useId();
  const buscaId = useId();
  const tituloDialogId = useId();
  const descDialogId = useId();

  const [estadoCriar, acaoCriar, criando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await criarResidente(prev, formData);
      if (res.ok) {
        setAvisoOk(res.ok);
        setMostrarFormNovo(false);
        setNomeNovo("");
        setCpfNovo("");
        setSexoNovo("F");
        setNascNovo("");
        setIngNovo(hojeIso);
        setObsNova("");
      }
      return res;
    },
    {},
  );

  const [, acaoConfirmarModal, processandoModal] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const acaoTipo = String(formData.get("acaoModal") ?? "");
      const res =
        acaoTipo === "recusa"
          ? await responderSolicitacao(prev, formData)
          : await removerFamiliar(prev, formData);
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

  const processandoRef = useRef(processandoModal);
  useEffect(() => {
    processandoRef.current = processandoModal;
    const dialog = dialogRef.current;
    if (dialog) dialog.setAttribute("closedby", processandoModal ? "none" : "any");
  }, [processandoModal]);

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
      if (!processandoRef.current && pressionouFora && fora(e)) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  function abrirModal(alvo: ModalAlvo) {
    setErroDialogo("");
    setAvisoOk("");
    setAlvoModal(alvo);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarBtnRef.current?.focus();
    }
  }

  const solicitacoesPendentes = useMemo(
    () =>
      solicitacoes.filter(
        (s) =>
          s.status === "PENDENTE" && (filtroCasa === "TODAS" || s.casaId === filtroCasa),
      ),
    [solicitacoes, filtroCasa],
  );

  const residentesDaCasaFiltro = useMemo(
    () =>
      filtroCasa === "TODAS"
        ? residentes
        : residentes.filter((r) => r.casaId === filtroCasa),
    [residentes, filtroCasa],
  );

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return residentesDaCasaFiltro.filter((r) => {
      if (filtroStatus === "ATIVOS" && r.status !== "ATIVO") return false;
      if (filtroStatus === "INATIVOS" && r.status === "ATIVO") return false;
      if (termo && !r.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [residentesDaCasaFiltro, filtroStatus, busca]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {casas.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar residentes por casa">
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
                {residentes.length}
              </span>
            </button>

            {casas.map((casa) => {
              const qtd = residentes.filter((r) => r.casaId === casa.id).length;
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
              Novo residente
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
            Cadastrar residente
          </h2>

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

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor={`${formId}-nome`} className={labelClass}>
                  Nome completo *
                </label>
                <input
                  id={`${formId}-nome`}
                  name="nome"
                  required
                  maxLength={120}
                  value={nomeNovo}
                  onChange={(e) => setNomeNovo(e.target.value)}
                  placeholder="Nome do morador"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor={`${formId}-cpf`} className={labelClass}>
                  CPF *
                </label>
                <input
                  id={`${formId}-cpf`}
                  name="cpf"
                  required
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={cpfNovo}
                  onChange={(e) => setCpfNovo(formatarCpf(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor={`${formId}-sexo`} className={labelClass}>
                  Sexo *
                </label>
                <select
                  id={`${formId}-sexo`}
                  name="sexo"
                  required
                  value={sexoNovo}
                  onChange={(e) => setSexoNovo(e.target.value)}
                  className={cn(inputClass, "bg-card")}
                >
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                  <option value="O">Outro</option>
                </select>
              </div>

              <div>
                <label htmlFor={`${formId}-nasc`} className={labelClass}>
                  Data de nascimento *
                </label>
                <input
                  id={`${formId}-nasc`}
                  name="nascimento"
                  type="date"
                  required
                  max={hojeIso}
                  value={nascNovo}
                  onChange={(e) => setNascNovo(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor={`${formId}-ing`} className={labelClass}>
                  Data de ingresso *
                </label>
                <input
                  id={`${formId}-ing`}
                  name="ingresso"
                  type="date"
                  required
                  value={ingNovo}
                  onChange={(e) => setIngNovo(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={`${formId}-obs`} className={labelClass}>
                  Observações médicas (opcional)
                </label>
                <textarea
                  id={`${formId}-obs`}
                  name="observacoesMedicas"
                  rows={3}
                  maxLength={2000}
                  value={obsNova}
                  onChange={(e) => setObsNova(e.target.value)}
                  placeholder="Alergias, medicamentos contínuos, restrições alimentares."
                  className={cn(inputClass, "resize-y")}
                />
              </div>
            </div>

            {estadoCriar.erro ? (
              <p role="alert" className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger">
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
                {criando ? "Cadastrando..." : "Cadastrar residente"}
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

      {solicitacoesPendentes.length > 0 ? (
        <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">
              Solicitações de entrada ({solicitacoesPendentes.length})
            </h2>
          </div>

          <ul className="mt-4 space-y-3">
            {solicitacoesPendentes.map((s) => (
              <CardSolicitacaoPendente
                key={s.id}
                solicitacao={s}
                residentesDaCasa={residentes.filter((r) => r.casaId === s.casaId)}
                mostrarCasa={filtroCasa === "TODAS" && casas.length > 1}
                onAviso={setAvisoOk}
                onPedirRecusa={(alvo) => abrirModal({ tipo: "recusa", solicitacao: alvo })}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
          {(
            [
              { valor: "ATIVOS", rotulo: "Ativos" },
              { valor: "TODOS", rotulo: "Todos" },
              { valor: "INATIVOS", rotulo: "Inativos / Alta" },
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
            Buscar residente por nome
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
            placeholder="Buscar residente..."
            autoCorrect="off"
            spellCheck={false}
            className="min-h-10 w-full border-b border-input bg-transparent py-1.5 pl-6 pr-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm"
          />
        </search>
      </div>

      <p aria-live="polite" className="sr-only">
        {visiveis.length === 1
          ? "Mostrando 1 residente."
          : `Mostrando ${visiveis.length} residentes.`}
      </p>

      {visiveis.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Users className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-base font-semibold">
            {residentesDaCasaFiltro.length === 0
              ? "Nenhum residente cadastrado"
              : "Nenhum residente encontrado"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {residentesDaCasaFiltro.length === 0
              ? "Cadastre o primeiro morador para acompanhar a rotina e vincular familiares."
              : "Tente limpar a busca ou trocar o filtro de situação."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((residente) => (
            <CardResidente
              key={residente.id}
              residente={residente}
              mostrarCasa={filtroCasa === "TODAS" && casas.length > 1}
              onAviso={setAvisoOk}
              onPedirRemoverFamiliar={(res, fam) =>
                abrirModal({ tipo: "familiar", residente: res, familiar: fam })
              }
            />
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloDialogId}
        aria-describedby={descDialogId}
        onCancel={(e) => {
          if (processandoModal) e.preventDefault();
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
              {alvoModal?.tipo === "recusa" ? "Recusar solicitação?" : "Remover vínculo familiar?"}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={processandoModal}
              aria-label="Fechar janela"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p id={descDialogId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {alvoModal?.tipo === "recusa" ? (
              <>
                A solicitação de{" "}
                <span className="font-semibold text-foreground">
                  {alvoModal.solicitacao.solicitanteNome}
                </span>{" "}
                para{" "}
                <span className="font-medium text-foreground">
                  {alvoModal.solicitacao.casaNome}
                </span>{" "}
                será marcada como recusada.
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {alvoModal?.familiar.nome ?? "Este familiar"}
                </span>{" "}
                deixará de ver o prontuário e a linha do tempo de{" "}
                <span className="font-medium text-foreground">
                  {alvoModal?.residente.nome ?? "este residente"}
                </span>
                .
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
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={processandoModal}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>

            <form action={acaoConfirmarModal}>
              {alvoModal?.tipo === "recusa" ? (
                <>
                  <input type="hidden" name="acaoModal" value="recusa" />
                  <input type="hidden" name="id" value={alvoModal.solicitacao.id} />
                  <input type="hidden" name="casaId" value={alvoModal.solicitacao.casaId} />
                  <input type="hidden" name="decisao" value="RECUSADA" />
                </>
              ) : alvoModal?.tipo === "familiar" ? (
                <>
                  <input type="hidden" name="acaoModal" value="familiar" />
                  <input type="hidden" name="id" value={alvoModal.familiar.id} />
                  <input type="hidden" name="casaId" value={alvoModal.residente.casaId} />
                  <input type="hidden" name="residenteId" value={alvoModal.residente.id} />
                </>
              ) : null}
              <button
                type="submit"
                disabled={processandoModal || !alvoModal}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {processandoModal ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {alvoModal?.tipo === "recusa" ? "Recusar pedido" : "Remover vínculo"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
