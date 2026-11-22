/** Formatação de datas, dinheiro e rótulos do painel. */

const TIPOS: Record<string, string> = {
  CUIDADO: "Cuidado",
  MEDICAMENTO: "Medicamento",
  SINAL_VITAL: "Sinal vital",
  OCORRENCIA: "Ocorrência",
};

export function rotuloTipo(tipo: string): string {
  return TIPOS[tipo] ?? tipo;
}

export function dataCurta(iso: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
}

export function dataHora(iso: string): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return `${data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${data.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function reais(valor: number): string {
  const decimais = Number.isInteger(valor) ? 0 : 2;
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: 2,
  });
}

export function idade(nascimento: string): number | null {
  const data = new Date(nascimento);
  if (Number.isNaN(data.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - data.getFullYear();
  const mes = hoje.getMonth() - data.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) anos -= 1;
  return anos;
}
