// Fuso fixo evita divergência de hidratação entre servidor (UTC) e navegador (BRT).
const FUSO = "America/Sao_Paulo";

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

const DATA_PURA_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

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

/** Formata data pura YYYY-MM-DD sem deslocar um dia em fusos negativos, ou ISO completo. */
export function dataCurta(valor: string): string {
  if (!valor) return "—";
  const pura = DATA_PURA_RE.exec(valor);
  if (pura) return `${pura[3]}/${pura[2]}/${pura[1]}`;

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR", { timeZone: FUSO });
}

export function dataHora(iso: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  const dia = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: FUSO,
  });
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  });
  return `${dia}, ${hora}`;
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

/** Chave YYYY-MM-DD no fuso de Brasília para agrupar entradas da linha do tempo. */
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

/** Rótulo legível do dia ("Hoje", "Ontem" ou "20 de novembro de 2026"). */
export function rotuloDia(chave: string, diaHoje: string): string {
  if (!chave) return "Data desconhecida";
  if (chave === diaHoje) return "Hoje";
  if (chave === chaveDiaAnterior(diaHoje)) return "Ontem";

  const m = DATA_PURA_RE.exec(chave);
  if (!m) return chave;
  // Meio-dia UTC garante o mesmo dia civil em qualquer fuso ao formatar.
  const data = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function idade(nascimento: string): number | null {
  if (!nascimento) return null;
  const pura = DATA_PURA_RE.exec(nascimento);
  const hoje = DATA_PURA_RE.exec(chaveDia(new Date()));
  if (!hoje) return null;

  const anoHoje = Number(hoje[1]);
  const mesHoje = Number(hoje[2]);
  const diaHoje = Number(hoje[3]);

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

export function atrasoMinutos(criadoEm: string, sincronizadoEm: string): number {
  const diff = new Date(sincronizadoEm).getTime() - new Date(criadoEm).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.round(diff / 60000);
}
