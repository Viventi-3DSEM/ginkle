"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CloudOff,
  Loader2,
  Pill,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { DadosNovoRegistro, TipoRegistro } from "@/lib/funcionario/dados";
import { cn } from "@/lib/utils";
import BannerFilaOffline from "./BannerFilaOffline";
import { useOffline } from "./OfflineProvider";

const OPCOES_TIPO: {
  valor: TipoRegistro;
  rotulo: string;
  resumo: string;
  Icone: LucideIcon;
}[] = [
  {
    valor: "CUIDADO",
    rotulo: "Cuidado",
    resumo: "Higiene, alimentação, hidratação e rotina",
    Icone: ClipboardCheck,
  },
  {
    valor: "MEDICAMENTO",
    rotulo: "Medicamento",
    resumo: "Dose administrada, via e resposta",
    Icone: Pill,
  },
  {
    valor: "SINAL_VITAL",
    rotulo: "Sinal vital",
    resumo: "Pressão, pulso, temperatura, SpO₂ e glicemia",
    Icone: Activity,
  },
  {
    valor: "OCORRENCIA",
    rotulo: "Ocorrência",
    resumo: "Intercorrência, observação ou conduta",
    Icone: AlertTriangle,
  },
];

const ATALHOS_CUIDADO = [
  "Banho e higiene",
  "Alimentação assistida",
  "Hidratação oral",
  "Troca de fralda / curativo",
  "Mobilidade e caminhada",
  "Repouso tranquilo",
];

const ATALHOS_OCORRENCIA = [
  "Recusa alimentar",
  "Alteração de humor / agitação",
  "Queda sem lesão aparente",
  "Queixa de dor ou desconforto",
  "Contato com a família",
];

const VIAS_MEDICAMENTO = ["Oral", "Subcutânea", "Tópica", "Inalatória", "Ocular / Nasal", "Outra"];

const inputClass =
  "ginkle-field w-full border-b border-input bg-transparent py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand-strong sm:text-sm";
const labelClass =
  "block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

type Props = {
  dados: DadosNovoRegistro;
  residenteInicial?: string;
  tipoInicial?: TipoRegistro;
};

type ErroCampos = {
  residente?: string;
  titulo?: string;
  descricao?: string;
  horario?: string;
};

function horaAtualInput(): string {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, "0");
  const m = String(agora.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function isoDoHorarioHoje(hhmm: string): string | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const horas = Number(m[1]);
  const minutos = Number(m[2]);
  if (horas > 23 || minutos > 59) return null;
  const data = new Date();
  data.setHours(horas, minutos, 0, 0);
  return data.toISOString();
}

export default function FormNovoRegistro({ dados, residenteInicial, tipoInicial }: Props) {
  const { online, salvarRegistro } = useOffline();
  const baseId = useId();

  const residentesAtivos = useMemo(
    () => dados.residentes.filter((r) => r.status === "ATIVO"),
    [dados.residentes],
  );
  const residentesDisponiveis = residentesAtivos.length > 0 ? residentesAtivos : dados.residentes;

  const residenteInicialValido = residentesDisponiveis.find((r) => r.id === residenteInicial);

  const [filtroCasa, setFiltroCasa] = useState<string>(
    residenteInicialValido?.casaId ?? (dados.casas.length === 1 ? dados.casas[0].casaId : "TODAS"),
  );
  const [residenteId, setResidenteId] = useState<string>(
    residenteInicialValido?.id ??
      (residentesDisponiveis.length === 1 ? residentesDisponiveis[0].id : ""),
  );
  const [tipo, setTipo] = useState<TipoRegistro>(tipoInicial ?? "CUIDADO");

  // Campos principais
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  // Campos guiados de Medicamento
  const [medNome, setMedNome] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medVia, setMedVia] = useState("Oral");

  // Campos guiados de Sinal vital
  const [pa, setPa] = useState("");
  const [fc, setFc] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [glicemia, setGlicemia] = useState("");

  // Campo guiado de Ocorrência
  const [nivelOcorrencia, setNivelOcorrencia] = useState<"Rotina" | "Atenção" | "Urgente">(
    "Atenção",
  );

  // Horário do cuidado
  const [usarHorarioAnterior, setUsarHorarioAnterior] = useState(false);
  const [horaManual, setHoraManual] = useState(horaAtualInput);

  // Estado de validação e envio
  const [erros, setErros] = useState<ErroCampos>({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState<{
    modo: "SINCRONIZADO" | "OFFLINE";
    mensagem: string;
    residenteId: string;
    residenteNome: string;
  } | null>(null);

  const residenteRef = useRef<HTMLSelectElement>(null);
  const tituloRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLTextAreaElement>(null);
  const horaRef = useRef<HTMLInputElement>(null);

  const residentesFiltrados = useMemo(
    () =>
      filtroCasa === "TODAS"
        ? residentesDisponiveis
        : residentesDisponiveis.filter((r) => r.casaId === filtroCasa),
    [residentesDisponiveis, filtroCasa],
  );

  const residenteAtual = useMemo(
    () => residentesDisponiveis.find((r) => r.id === residenteId) ?? null,
    [residentesDisponiveis, residenteId],
  );

  function limparCamposGuiados() {
    setTitulo("");
    setDescricao("");
    setMedNome("");
    setMedDose("");
    setMedVia("Oral");
    setPa("");
    setFc("");
    setTemp("");
    setSpo2("");
    setGlicemia("");
    setNivelOcorrencia("Atenção");
    setUsarHorarioAnterior(false);
    setHoraManual(horaAtualInput());
    setErros({});
    setErroGeral("");
  }

  function montarConteudo(): { tituloFinal: string; descricaoFinal: string } {
    if (tipo === "MEDICAMENTO") {
      const nomeLimpo = medNome.trim();
      const doseLimpa = medDose.trim();
      const tituloFinal =
        titulo.trim() ||
        (nomeLimpo ? `Medicação: ${nomeLimpo}${doseLimpa ? ` (${doseLimpa})` : ""}` : "");

      const linhas: string[] = [];
      if (nomeLimpo) {
        linhas.push(
          `Medicamento: ${nomeLimpo}${doseLimpa ? ` · Dose: ${doseLimpa}` : ""} · Via: ${medVia}.`,
        );
      }
      if (descricao.trim()) linhas.push(descricao.trim());
      return {
        tituloFinal: tituloFinal.slice(0, 100),
        descricaoFinal: linhas.join("\n"),
      };
    }

    if (tipo === "SINAL_VITAL") {
      const medicoes: string[] = [];
      if (pa.trim()) medicoes.push(`PA ${pa.trim()} mmHg`);
      if (fc.trim()) medicoes.push(`FC ${fc.trim()} bpm`);
      if (temp.trim()) medicoes.push(`Temp ${temp.trim()} °C`);
      if (spo2.trim()) medicoes.push(`SpO₂ ${spo2.trim()}%`);
      if (glicemia.trim()) medicoes.push(`Glicemia ${glicemia.trim()} mg/dL`);

      const tituloFinal = titulo.trim() || (medicoes.length > 0 ? "Aferição de sinais vitais" : "");
      const linhas: string[] = [];
      if (medicoes.length > 0) linhas.push(`Medições: ${medicoes.join(" · ")}.`);
      if (descricao.trim()) linhas.push(descricao.trim());
      return {
        tituloFinal: tituloFinal.slice(0, 100),
        descricaoFinal: linhas.join("\n"),
      };
    }

    if (tipo === "OCORRENCIA") {
      const tituloBase = titulo.trim();
      const tituloFinal = tituloBase
        ? nivelOcorrencia === "Urgente" && !tituloBase.toLowerCase().startsWith("[urgente]")
          ? `[Urgente] ${tituloBase}`
          : tituloBase
        : "";
      const linhas: string[] = [`Nível de atenção: ${nivelOcorrencia}.`];
      if (descricao.trim()) linhas.push(descricao.trim());
      return {
        tituloFinal: tituloFinal.slice(0, 100),
        descricaoFinal: descricao.trim() ? linhas.join("\n") : "",
      };
    }

    return {
      tituloFinal: titulo.trim().slice(0, 100),
      descricaoFinal: descricao.trim(),
    };
  }

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroGeral("");
    setSucesso(null);

    const novosErros: ErroCampos = {};
    const { tituloFinal, descricaoFinal } = montarConteudo();

    if (!residenteAtual) {
      novosErros.residente = "Selecione o residente atendido.";
    }
    if (tituloFinal.length < 3) {
      novosErros.titulo =
        tipo === "MEDICAMENTO"
          ? "Informe o nome do medicamento ou um título (mínimo 3 caracteres)."
          : tipo === "SINAL_VITAL"
            ? "Preencha ao menos um sinal vital ou informe um título."
            : "Informe um título resumido (mínimo 3 caracteres).";
    }
    if (descricaoFinal.length < 3) {
      novosErros.descricao =
        tipo === "SINAL_VITAL"
          ? "Informe ao menos uma medição ou uma observação (mínimo 3 caracteres)."
          : "Descreva brevemente o atendimento realizado (mínimo 3 caracteres).";
    }

    let criadoEmIso = new Date().toISOString();
    if (usarHorarioAnterior) {
      const iso = isoDoHorarioHoje(horaManual);
      if (!iso) {
        novosErros.horario = "Informe um horário válido no formato HH:MM.";
      } else if (new Date(iso).getTime() > Date.now() + 2 * 60_000) {
        novosErros.horario = "O horário do cuidado não pode estar no futuro.";
      } else {
        criadoEmIso = iso;
      }
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      if (novosErros.residente) residenteRef.current?.focus();
      else if (novosErros.titulo) tituloRef.current?.focus();
      else if (novosErros.descricao) descricaoRef.current?.focus();
      else if (novosErros.horario) horaRef.current?.focus();
      return;
    }

    setErros({});
    setSalvando(true);
    try {
      const resultado = await salvarRegistro({
        casaId: residenteAtual!.casaId,
        casaNome: residenteAtual!.casaNome,
        residenteId: residenteAtual!.id,
        residenteNome: residenteAtual!.nome,
        tipo,
        titulo: tituloFinal,
        descricao: descricaoFinal,
        criadoEmDispositivo: criadoEmIso,
      });

      if (resultado.modo === "ERRO") {
        setErroGeral(resultado.erro);
        return;
      }

      const alvoId = residenteAtual!.id;
      const alvoNome = residenteAtual!.nome;
      limparCamposGuiados();
      setSucesso({
        modo: resultado.modo,
        mensagem:
          resultado.modo === "SINCRONIZADO"
            ? `Registro salvo e sincronizado na linha do tempo de ${alvoNome}.`
            : resultado.motivo,
        residenteId: alvoId,
        residenteNome: alvoNome,
      });
    } finally {
      setSalvando(false);
    }
  }

  if (residentesDisponiveis.length === 0) {
    return (
      <div className="rounded-sm border border-border bg-card p-8 text-center">
        <p className="font-heading text-lg font-semibold">Nenhum residente cadastrado</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Assim que a gestão cadastrar residentes na sua casa, eles aparecerão aqui para o
          lançamento de cuidados.
        </p>
      </div>
    );
  }

  const errResidenteId = `${baseId}-err-residente`;
  const errTituloId = `${baseId}-err-titulo`;
  const errDescricaoId = `${baseId}-err-descricao`;
  const errHorarioId = `${baseId}-err-horario`;
  const hintHorarioId = `${baseId}-hint-horario`;

  return (
    <div className="space-y-6">
      <BannerFilaOffline />

      {sucesso ? (
        <div
          role="status"
          className={cn(
            "rounded-sm border p-5",
            sucesso.modo === "SINCRONIZADO"
              ? "border-success/40 bg-success/10"
              : "border-warning/40 bg-warning/10",
          )}
        >
          <div className="flex items-start gap-3">
            {sucesso.modo === "SINCRONIZADO" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <CloudOff className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base font-semibold text-foreground">
                {sucesso.modo === "SINCRONIZADO"
                  ? "Registro salvo com sucesso"
                  : "Salvo offline neste aparelho"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{sucesso.mensagem}</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href={`/funcionario/residentes/${sucesso.residenteId}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Ver linha do tempo de {sucesso.residenteNome}
                </Link>
                <button
                  type="button"
                  onClick={() => setSucesso(null)}
                  className="inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Lançar outro registro
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={aoEnviar}
        noValidate
        aria-label="Formulário de novo registro assistencial"
        className="space-y-8 rounded-sm border border-border bg-card p-5 sm:p-7"
      >
        {/* 1. Residente */}
        <div className="space-y-4">
          {dados.casas.length > 1 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar residentes por casa">
              <button
                type="button"
                aria-pressed={filtroCasa === "TODAS"}
                onClick={() => setFiltroCasa("TODAS")}
                className={cn(
                  "min-h-9 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                  filtroCasa === "TODAS"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:bg-secondary",
                )}
              >
                Todas as casas
              </button>
              {dados.casas.map((casa) => (
                <button
                  key={casa.casaId}
                  type="button"
                  aria-pressed={filtroCasa === casa.casaId}
                  onClick={() => {
                    setFiltroCasa(casa.casaId);
                    const daCasa = residentesDisponiveis.filter((r) => r.casaId === casa.casaId);
                    if (residenteAtual && residenteAtual.casaId !== casa.casaId) {
                      setResidenteId(daCasa.length === 1 ? daCasa[0].id : "");
                    }
                  }}
                  className={cn(
                    "min-h-9 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                    filtroCasa === casa.casaId
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {casa.casaNome}
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <label htmlFor={`${baseId}-residente`} className={labelClass}>
              Residente <span aria-hidden="true">*</span>
            </label>
            <select
              ref={residenteRef}
              id={`${baseId}-residente`}
              name="idResidente"
              required
              value={residenteId}
              aria-invalid={erros.residente ? "true" : "false"}
              aria-describedby={erros.residente ? errResidenteId : undefined}
              onChange={(e) => {
                setResidenteId(e.target.value);
                if (erros.residente) setErros((prev) => ({ ...prev, residente: undefined }));
              }}
              className={cn(inputClass, "mt-1 cursor-pointer bg-card")}
            >
              <option value="">Selecione o residente...</option>
              {residentesFiltrados.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                  {dados.casas.length > 1 ? ` — ${r.casaNome}` : ""}
                </option>
              ))}
            </select>
            {erros.residente ? (
              <p id={errResidenteId} className="mt-1.5 text-xs font-medium text-danger">
                Erro: {erros.residente}
              </p>
            ) : null}
          </div>

          {residenteAtual?.observacoesMedicas ? (
            <div className="rounded-sm border border-warning/35 bg-warning/10 p-3.5 text-xs leading-relaxed">
              <p className="flex items-center gap-1.5 font-semibold text-warning">
                <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
                Observações médicas de {residenteAtual.nome}
              </p>
              <p className="mt-1 text-foreground">{residenteAtual.observacoesMedicas}</p>
            </div>
          ) : null}
        </div>

        {/* 2. Tipo de registro (radios nativos acessíveis) */}
        <fieldset className="space-y-3">
          <legend className={labelClass}>
            Tipo de registro <span aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {OPCOES_TIPO.map((op) => {
              const selecionado = tipo === op.valor;
              const Icone = op.Icone;
              const radioId = `${baseId}-tipo-${op.valor}`;
              return (
                <div key={op.valor} className="relative">
                  <input
                    id={radioId}
                    type="radio"
                    name="tipo"
                    value={op.valor}
                    checked={selecionado}
                    onChange={() => {
                      setTipo(op.valor);
                      setErros((prev) => ({ ...prev, titulo: undefined, descricao: undefined }));
                    }}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={radioId}
                    className={cn(
                      "flex h-full cursor-pointer flex-col gap-1.5 rounded-sm border p-3.5 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                      selecionado
                        ? "border-brand-strong bg-secondary/70 text-foreground"
                        : "border-border bg-background/50 text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                    )}
                  >
                    <Icone
                      className={cn(
                        "size-5",
                        selecionado ? "text-brand-strong" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {op.rotulo}
                    </span>
                    <span className="text-[0.72rem] leading-snug text-muted-foreground">
                      {op.resumo}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* 3. Campos guiados conforme o tipo */}
        {tipo === "CUIDADO" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Atalhos rápidos de título:</p>
            <div className="flex flex-wrap gap-1.5">
              {ATALHOS_CUIDADO.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => {
                    setTitulo(sugestao);
                    if (erros.titulo) setErros((prev) => ({ ...prev, titulo: undefined }));
                  }}
                  className={cn(
                    "min-h-8 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    titulo === sugestao
                      ? "border-brand-strong bg-secondary text-brand-strong"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {tipo === "MEDICAMENTO" ? (
          <div className="grid gap-4 rounded-sm border border-border bg-background/50 p-4 sm:grid-cols-3">
            <div>
              <label htmlFor={`${baseId}-med-nome`} className={labelClass}>
                Medicamento
              </label>
              <input
                id={`${baseId}-med-nome`}
                type="text"
                value={medNome}
                onChange={(e) => {
                  setMedNome(e.target.value);
                  if (erros.titulo) setErros((prev) => ({ ...prev, titulo: undefined }));
                }}
                placeholder="Ex.: Losartana"
                maxLength={70}
                className={cn(inputClass, "mt-1")}
              />
            </div>
            <div>
              <label htmlFor={`${baseId}-med-dose`} className={labelClass}>
                Dose
              </label>
              <input
                id={`${baseId}-med-dose`}
                type="text"
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
                placeholder="Ex.: 50 mg (1 comp.)"
                maxLength={40}
                className={cn(inputClass, "mt-1")}
              />
            </div>
            <div>
              <label htmlFor={`${baseId}-med-via`} className={labelClass}>
                Via
              </label>
              <select
                id={`${baseId}-med-via`}
                value={medVia}
                onChange={(e) => setMedVia(e.target.value)}
                className={cn(inputClass, "mt-1 cursor-pointer bg-transparent")}
              >
                {VIAS_MEDICAMENTO.map((via) => (
                  <option key={via} value={via} className="bg-card text-foreground">
                    {via}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {tipo === "SINAL_VITAL" ? (
          <div className="space-y-3 rounded-sm border border-border bg-background/50 p-4">
            <p className="text-xs text-muted-foreground">
              Preencha apenas os sinais aferidos agora (campos opcionais):
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div>
                <label htmlFor={`${baseId}-pa`} className={labelClass}>
                  PA (mmHg)
                </label>
                <input
                  id={`${baseId}-pa`}
                  type="text"
                  inputMode="numeric"
                  value={pa}
                  onChange={(e) => {
                    setPa(e.target.value);
                    if (erros.titulo || erros.descricao) {
                      setErros((prev) => ({ ...prev, titulo: undefined, descricao: undefined }));
                    }
                  }}
                  placeholder="120/80"
                  maxLength={15}
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <label htmlFor={`${baseId}-fc`} className={labelClass}>
                  FC (bpm)
                </label>
                <input
                  id={`${baseId}-fc`}
                  type="text"
                  inputMode="numeric"
                  value={fc}
                  onChange={(e) => {
                    setFc(e.target.value);
                    if (erros.titulo || erros.descricao) {
                      setErros((prev) => ({ ...prev, titulo: undefined, descricao: undefined }));
                    }
                  }}
                  placeholder="74"
                  maxLength={10}
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <label htmlFor={`${baseId}-temp`} className={labelClass}>
                  Temp (°C)
                </label>
                <input
                  id={`${baseId}-temp`}
                  type="text"
                  inputMode="decimal"
                  value={temp}
                  onChange={(e) => {
                    setTemp(e.target.value);
                    if (erros.titulo || erros.descricao) {
                      setErros((prev) => ({ ...prev, titulo: undefined, descricao: undefined }));
                    }
                  }}
                  placeholder="36,5"
                  maxLength={10}
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <label htmlFor={`${baseId}-spo2`} className={labelClass}>
                  SpO₂ (%)
                </label>
                <input
                  id={`${baseId}-spo2`}
                  type="text"
                  inputMode="numeric"
                  value={spo2}
                  onChange={(e) => {
                    setSpo2(e.target.value);
                    if (erros.titulo || erros.descricao) {
                      setErros((prev) => ({ ...prev, titulo: undefined, descricao: undefined }));
                    }
                  }}
                  placeholder="97"
                  maxLength={10}
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor={`${baseId}-glicemia`} className={labelClass}>
                  Glicemia
                </label>
                <input
                  id={`${baseId}-glicemia`}
                  type="text"
                  inputMode="numeric"
                  value={glicemia}
                  onChange={(e) => {
                    setGlicemia(e.target.value);
                    if (erros.titulo || erros.descricao) {
                      setErros((prev) => ({ ...prev, titulo: undefined, descricao: undefined }));
                    }
                  }}
                  placeholder="105"
                  maxLength={10}
                  className={cn(inputClass, "mt-1")}
                />
              </div>
            </div>
          </div>
        ) : null}

        {tipo === "OCORRENCIA" ? (
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className={labelClass}>Nível de atenção</legend>
              <div className="flex flex-wrap gap-2">
                {(["Rotina", "Atenção", "Urgente"] as const).map((nivel) => {
                  const ativo = nivelOcorrencia === nivel;
                  const idNivel = `${baseId}-nivel-${nivel}`;
                  return (
                    <div key={nivel}>
                      <input
                        id={idNivel}
                        type="radio"
                        name="nivelOcorrencia"
                        value={nivel}
                        checked={ativo}
                        onChange={() => setNivelOcorrencia(nivel)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={idNivel}
                        className={cn(
                          "inline-flex min-h-9 cursor-pointer items-center rounded-sm border px-3.5 py-1.5 text-xs font-semibold transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring",
                          ativo
                            ? nivel === "Urgente"
                              ? "border-danger bg-danger/15 text-danger"
                              : nivel === "Atenção"
                                ? "border-warning bg-warning/15 text-warning"
                                : "border-brand-strong bg-secondary text-brand-strong"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary/50",
                        )}
                      >
                        {nivel}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Atalhos rápidos de ocorrência:</p>
              <div className="flex flex-wrap gap-1.5">
                {ATALHOS_OCORRENCIA.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => {
                      setTitulo(sugestao);
                      if (erros.titulo) setErros((prev) => ({ ...prev, titulo: undefined }));
                    }}
                    className={cn(
                      "min-h-8 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      titulo === sugestao
                        ? "border-warning bg-warning/15 text-warning"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* 4. Título e Descrição */}
        <div className="space-y-5">
          <div>
            <label htmlFor={`${baseId}-titulo`} className={labelClass}>
              Título{" "}
              {tipo === "SINAL_VITAL" || tipo === "MEDICAMENTO" ? (
                <span className="font-normal normal-case tracking-normal">(opcional se preenchido acima)</span>
              ) : (
                <span aria-hidden="true">*</span>
              )}
            </label>
            <input
              ref={tituloRef}
              id={`${baseId}-titulo`}
              name="titulo"
              type="text"
              maxLength={100}
              required={tipo === "CUIDADO" || tipo === "OCORRENCIA"}
              value={titulo}
              aria-invalid={erros.titulo ? "true" : "false"}
              aria-describedby={erros.titulo ? errTituloId : undefined}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (erros.titulo) setErros((prev) => ({ ...prev, titulo: undefined }));
              }}
              placeholder={
                tipo === "MEDICAMENTO"
                  ? "Ex.: Medicação da manhã administrada"
                  : tipo === "SINAL_VITAL"
                    ? "Ex.: Aferição matinal de rotina"
                    : tipo === "OCORRENCIA"
                      ? "Ex.: Recusa do almoço — aceitou suco"
                      : "Ex.: Banho assistido e troca de roupa"
              }
              className={cn(inputClass, "mt-1")}
            />
            {erros.titulo ? (
              <p id={errTituloId} className="mt-1.5 text-xs font-medium text-danger">
                Erro: {erros.titulo}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${baseId}-descricao`} className={labelClass}>
              Observações e detalhes{" "}
              {tipo === "SINAL_VITAL" || (tipo === "MEDICAMENTO" && medNome.trim()) ? (
                <span className="font-normal normal-case tracking-normal">(opcional)</span>
              ) : (
                <span aria-hidden="true">*</span>
              )}
            </label>
            <textarea
              ref={descricaoRef}
              id={`${baseId}-descricao`}
              name="descricao"
              rows={4}
              maxLength={2000}
              required={tipo === "CUIDADO" || tipo === "OCORRENCIA"}
              value={descricao}
              aria-invalid={erros.descricao ? "true" : "false"}
              aria-describedby={erros.descricao ? errDescricaoId : undefined}
              onChange={(e) => {
                setDescricao(e.target.value);
                if (erros.descricao) setErros((prev) => ({ ...prev, descricao: undefined }));
              }}
              placeholder={
                tipo === "OCORRENCIA"
                  ? "Descreva o que aconteceu, como o residente reagiu e qual conduta foi tomada."
                  : "Registre detalhes úteis para a passagem de plantão e para a família."
              }
              className={cn(inputClass, "mt-1 resize-y")}
            />
            {erros.descricao ? (
              <p id={errDescricaoId} className="mt-1.5 text-xs font-medium text-danger">
                Erro: {erros.descricao}
              </p>
            ) : null}
          </div>
        </div>

        {/* 5. Horário do cuidado (duplo timestamp antifraude) */}
        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
              <span>
                Horário do cuidado:{" "}
                <strong className="font-medium text-foreground">
                  {usarHorarioAnterior ? `Hoje às ${horaManual}` : "Agora (horário do dispositivo)"}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setUsarHorarioAnterior((v) => !v);
                setHoraManual(horaAtualInput());
                setErros((prev) => ({ ...prev, horario: undefined }));
              }}
              className="text-xs font-medium text-brand-strong underline-offset-4 hover:underline"
            >
              {usarHorarioAnterior ? "Usar horário atual" : "Cuidado feito mais cedo?"}
            </button>
          </div>

          {usarHorarioAnterior ? (
            <div className="max-w-xs">
              <label htmlFor={`${baseId}-hora`} className={labelClass}>
                Horário em que o cuidado foi prestado (hoje)
              </label>
              <span id={hintHorarioId} className="mt-1 block text-xs text-muted-foreground">
                A auditoria mantém tanto o horário informado quanto o horário de recebimento no
                servidor.
              </span>
              <input
                ref={horaRef}
                id={`${baseId}-hora`}
                type="time"
                value={horaManual}
                aria-invalid={erros.horario ? "true" : "false"}
                aria-describedby={
                  erros.horario ? `${hintHorarioId} ${errHorarioId}` : hintHorarioId
                }
                onChange={(e) => {
                  setHoraManual(e.target.value);
                  if (erros.horario) setErros((prev) => ({ ...prev, horario: undefined }));
                }}
                className={cn(inputClass, "mt-1")}
              />
              {erros.horario ? (
                <p id={errHorarioId} className="mt-1.5 text-xs font-medium text-danger">
                  Erro: {erros.horario}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {erroGeral ? (
          <p
            role="alert"
            className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {erroGeral}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            {online
              ? "O registro será salvo e sincronizado imediatamente."
              : "Sem internet: o registro será guardado neste aparelho e sincronizado automaticamente."}
          </p>

          <button
            type="submit"
            disabled={salvando}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          >
            {salvando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Salvando...
              </>
            ) : online ? (
              "Salvar registro"
            ) : (
              "Salvar offline no aparelho"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
