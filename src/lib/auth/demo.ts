// Contas de demonstração para apresentação (banca).
//
// Só aparecem quando DEMO_HABILITADO=1 E DEMO_SENHA tem pelo menos 6 caracteres —
// as duas variáveis são de servidor, nunca NEXT_PUBLIC. Nenhuma senha mora no
// repositório: a mesma senha do `supabase/demo.mjs` vai no ambiente (Vercel ou
// .env.local) no dia da apresentação.

export type PapelDemo = "familiar" | "funcionario" | "gestor";

export type ContaDemo = {
  papel: PapelDemo;
  rotulo: string;
  nome: string;
  email: string;
};

export const CONTAS_DEMO: ContaDemo[] = [
  { papel: "familiar", rotulo: "Familiar", nome: "Maria Souza", email: "maria.souza@ginkle.me" },
  { papel: "funcionario", rotulo: "Funcionário", nome: "Ana Paula", email: "ana.paula@ginkle.me" },
  { papel: "gestor", rotulo: "Gestor", nome: "Helena Prado", email: "gestor.demo@ginkle.me" },
];

export function senhaDemo(): string | null {
  const senha = (process.env.DEMO_SENHA ?? "").trim();
  return senha.length >= 6 ? senha : null;
}

export function demoHabilitado(): boolean {
  return process.env.DEMO_HABILITADO === "1" && senhaDemo() !== null;
}

export function contaDemoPorPapel(papel: string): ContaDemo | undefined {
  return CONTAS_DEMO.find((conta) => conta.papel === papel);
}
