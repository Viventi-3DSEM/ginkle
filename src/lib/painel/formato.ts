// Fuso fixo evita divergência de hidratação entre servidor (UTC) e navegador (BRT).
const FUSO = "America/Sao_Paulo";
const DATA_PURA_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const TIPOS: Record<string, string> = {
  CUIDADO: "Cuidado",
  MEDICAMENTO: "Medicamento",
  SINAL_VITAL: "Sinal vital",
  OCORRENCIA: "Ocorrência",
};

const STATUS_RESIDENTE: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  ALTA: "Alta",
  OBITO: "Óbito",
};

const STATUS_ADESAO: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
};

const SEXOS: Record<string, string> = {
  F: "Feminino",
  M: "Masculino",
  O: "Outro",
};

export function rotuloTipo(tipo: string): string {
  return TIPOS[tipo] ?? tipo;
}

export function rotuloStatusResidente(status: string): string {
  return STATUS_RESIDENTE[status] ?? status;
}

export function rotuloStatusAdesao(status: string): string {
  return STATUS_ADESAO[status] ?? status;
}

export function rotuloSexo(sexo: string): string {
  return SEXOS[sexo] ?? sexo;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function dataCurta(valor: string): string {
  if (!valor) return "—";
  const pura = DATA_PURA_RE.exec(valor);
  if (pura) return `${pura[3]}/${pura[2]}/${pura[1]}`;

  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? "—"
    : data.toLocaleDateString("pt-BR", { timeZone: FUSO });
}

export function dataHora(iso: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return `${data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: FUSO,
  })}, ${data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  })}`;
}

export function reais(valor: number): string {
  const decimais = Number.isInteger(valor) ? 0 : 2;
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: 2,
  });
}

export function idade(nascimento: string): number | null {
  if (!nascimento) return null;
  const hoje = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FUSO,
  }).formatToParts(new Date());
  const anoHoje = Number(hoje.find((p) => p.type === "year")?.value ?? 0);
  const mesHoje = Number(hoje.find((p) => p.type === "month")?.value ?? 0);
  const diaHoje = Number(hoje.find((p) => p.type === "day")?.value ?? 0);
  if (!anoHoje) return null;

  const pura = DATA_PURA_RE.exec(nascimento);
  if (pura) {
    let anos = anoHoje - Number(pura[1]);
    const mes = mesHoje - Number(pura[2]);
    if (mes < 0 || (mes === 0 && diaHoje < Number(pura[3]))) anos -= 1;
    return anos >= 0 ? anos : null;
  }

  const data = new Date(nascimento);
  if (Number.isNaN(data.getTime())) return null;
  let anos = anoHoje - data.getUTCFullYear();
  const mes = mesHoje - (data.getUTCMonth() + 1);
  if (mes < 0 || (mes === 0 && diaHoje < data.getUTCDate())) anos -= 1;
  return anos >= 0 ? anos : null;
}
