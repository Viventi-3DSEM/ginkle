/** Utilitários de telefone: o banco guarda só dígitos, o formulário mostra a máscara. */

import { soDigitos } from "./cpf";

// Máscara progressiva. Aceita fixo (10) e celular (11) sem detectar qual é.
export function formatarTelefone(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Fixo com DDD (10) ou celular com DDD (11). */
export function telefoneValido(valor: string): boolean {
  const d = soDigitos(valor);
  return d.length === 10 || d.length === 11;
}