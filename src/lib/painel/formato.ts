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

const CARGOS: Record<string, string> = {
  GESTOR: "Gestor",
  FUNCIONARIO: "Funcionário",
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

export function rotuloCargo(cargo: string): string {
  return CARGOS[cargo] ?? cargo;
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

export function horaCurta(iso: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  });
}

export function dataHoraSegundos(iso: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  const dia = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: FUSO,
  });
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: FUSO,
  });
  return `${dia} às ${hora}`;
}

export function chaveDia(iso: string | Date): string {
  const data = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(data.getTime())) return "";
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FUSO,
  }).formatToParts(data);
  const ano = partes.find((p) => p.type === "year")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";
  const dia = partes.find((p) => p.type === "day")?.value ?? "";
  return ano && mes && dia ? `${ano}-${mes}-${dia}` : "";
}

function chaveDiaAnterior(chave: string): string {
  const m = DATA_PURA_RE.exec(chave);
  if (!m) return "";
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) - 1);
  return new Date(utc).toISOString().slice(0, 10);
}

export function rotuloDia(chave: string, diaHoje: string): string {
  if (!chave) return "Data desconhecida";
  if (chave === diaHoje) return "Hoje";
  if (chave === chaveDiaAnterior(diaHoje)) return "Ontem";

  const m = DATA_PURA_RE.exec(chave);
  if (!m) return chave;
  const data = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type DuracaoPartes = {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
};

type DurationFormatInstancia = { format(duracao: DuracaoPartes): string };
type DurationFormatCtor = new (
  locale: string,
  options: { style: "long" | "short" | "narrow" | "digital" },
) => DurationFormatInstancia;

type TemporalInstantInstancia = {
  since(
    outro: TemporalInstantInstancia,
    opts?: { largestUnit?: string; smallestUnit?: string },
  ): {
    sign: number;
    hours: number;
    minutes: number;
    seconds: number;
    toString(): string;
  };
};

type TemporalGlobal = {
  Instant?: {
    from(iso: string): TemporalInstantInstancia;
  };
};

let formatadorDuracaoCache: DurationFormatInstancia | null | undefined;

function obterFormatadorDuracao(): DurationFormatInstancia | null {
  if (formatadorDuracaoCache !== undefined) return formatadorDuracaoCache;
  const ctor = (Intl as unknown as { DurationFormat?: DurationFormatCtor }).DurationFormat;
  formatadorDuracaoCache = typeof ctor === "function" ? new ctor("pt-BR", { style: "short" }) : null;
  return formatadorDuracaoCache;
}

function formatarDuracaoFallback(partes: DuracaoPartes): string {
  const tokens: string[] = [];
  if (partes.days) tokens.push(`${partes.days} d`);
  if (partes.hours) tokens.push(`${partes.hours} h`);
  if (partes.minutes) tokens.push(`${partes.minutes} min`);
  if (partes.seconds || tokens.length === 0) tokens.push(`${partes.seconds ?? 0} s`);
  if (tokens.length === 1) return tokens[0];
  if (tokens.length === 2) return `${tokens[0]} e ${tokens[1]}`;
  return `${tokens.slice(0, -1).join(", ")} e ${tokens[tokens.length - 1]}`;
}

/**
 * Calcula e formata a diferença entre o horário do dispositivo e o do servidor.
 * Usa Temporal.Instant (quando disponível) e Intl.DurationFormat em pt-BR.
 */
export function duracaoIntervalo(
  inicioIso: string,
  fimIso: string,
): { segundos: number; adiantado: boolean; rotulo: string; iso: string } {
  let totalSegundos = 0;
  let adiantado = false;
  let isoPadrao = "PT0S";

  const temporal = (globalThis as unknown as { Temporal?: TemporalGlobal }).Temporal;
  if (temporal?.Instant) {
    try {
      const a = temporal.Instant.from(inicioIso);
      const b = temporal.Instant.from(fimIso);
      const diff = b.since(a, { largestUnit: "hour", smallestUnit: "second" });
      adiantado = diff.sign < 0;
      const h = Math.abs(diff.hours);
      const m = Math.abs(diff.minutes);
      const s = Math.abs(diff.seconds);
      totalSegundos = h * 3600 + m * 60 + s;
      isoPadrao = diff.toString().replace(/^-/, "");
    } catch {
      totalSegundos = 0;
    }
  } else {
    const ms = new Date(fimIso).getTime() - new Date(inicioIso).getTime();
    if (Number.isFinite(ms)) {
      adiantado = ms < 0;
      totalSegundos = Math.round(Math.abs(ms) / 1000);
    }
  }

  if (totalSegundos < 1) {
    return { segundos: 0, adiantado: false, rotulo: "Imediato", iso: "PT0S" };
  }

  const days = Math.floor(totalSegundos / 86400);
  const restoDia = totalSegundos % 86400;
  const hours = Math.floor(restoDia / 3600);
  const restoHora = restoDia % 3600;
  const minutes = Math.floor(restoHora / 60);
  const seconds = restoHora % 60;

  // Para intervalos de horas ou dias, omite segundos na exibição para manter leitura limpa.
  const partes: DuracaoPartes = {};
  if (days > 0) partes.days = days;
  if (hours > 0) partes.hours = hours;
  if (minutes > 0) partes.minutes = minutes;
  if (days === 0 && hours === 0 && (minutes === 0 || seconds > 0) && minutes < 10) {
    partes.seconds = seconds;
  }

  if (isoPadrao === "PT0S") {
    const dStr = days > 0 ? `${days}D` : "";
    const tStr =
      (hours > 0 ? `${hours}H` : "") +
      (minutes > 0 ? `${minutes}M` : "") +
      (seconds > 0 || (!days && !hours && !minutes) ? `${seconds}S` : "");
    isoPadrao = `P${dStr}${tStr ? `T${tStr}` : ""}`;
  }

  const fmt = obterFormatadorDuracao();
  const rotulo = fmt ? fmt.format(partes) : formatarDuracaoFallback(partes);

  return { segundos: totalSegundos, adiantado, rotulo, iso: isoPadrao };
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
