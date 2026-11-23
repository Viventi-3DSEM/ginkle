/**
 * Interpreta valores monetários em formato brasileiro ou decimal simples.
 * Exemplos aceitos: "3200", "3.200", "3.200,00", "3200,50", "R$ 3.200,5", "3200.50".
 * Evita que "3.200" (milhar BR sem centavos) vire 3.2.
 */
export function parseValorMonetario(bruto: string, max = 999999.99): number | null {
  const limpo = bruto.replace(/R\$/gi, "").replace(/\s+/g, "");
  if (!limpo) return null;

  let normalizado: string | null = null;

  if (limpo.includes(",")) {
    // Formato brasileiro com vírgula decimal: "3.200,00", "3200,50", "3200,5"
    if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(limpo) || /^\d+(,\d{1,2})?$/.test(limpo)) {
      normalizado = limpo.replace(/\./g, "").replace(",", ".");
    }
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // Apenas separador de milhar brasileiro: "3.200", "1.250.000"
    normalizado = limpo.replace(/\./g, "");
  } else if (/^\d+(\.\d{1,2})?$/.test(limpo)) {
    // Inteiro ou decimal simples com ponto: "3200", "3200.5", "3200.50"
    normalizado = limpo;
  }

  if (!normalizado) return null;
  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || valor < 0 || valor > max) return null;
  return Math.round(valor * 100) / 100;
}
