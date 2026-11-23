const ORIGEM_BASE = "https://ginkle.local";

/**
 * Aceita apenas caminhos internos relativos (ex.: `/cliente`, `/gerente/casas?a=1`).
 * Rejeita URLs absolutas, `//host`, `/\host`, caracteres de controle e esquemas externos.
 */
export function destinoSeguro(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const limpo = raw.trim();
  if (!limpo.startsWith("/")) return null;
  if (/^\/[\\/]/.test(limpo)) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(limpo)) return null;

  try {
    const parsed = new URL(limpo, ORIGEM_BASE);
    if (parsed.origin !== ORIGEM_BASE) return null;
    if (!parsed.pathname.startsWith("/")) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
