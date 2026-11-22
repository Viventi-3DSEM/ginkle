import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { CONTAS_DEMO, demoHabilitado } from "@/lib/auth/demo";

export const metadata: Metadata = {
  title: "Entrar · Ginkle",
  description: "Acesse o Ginkle para acompanhar os cuidados de quem você ama.",
};

const CODIGOS_DE_ERRO: Record<string, string> = {
  "link-invalido": "Este link não é válido. Peça um novo e-mail de recuperação.",
  "link-expirado": "O link expirou ou já foi usado. Peça um novo na tela de recuperação.",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string; redefinida?: string }>;
}) {
  const params = await searchParams;

  const erro =
    params.erro === undefined
      ? undefined
      : (CODIGOS_DE_ERRO[params.erro] ?? decodeURIComponent(params.erro));

  const aviso =
    params.redefinida === "1"
      ? "Senha alterada. Entre com a nova senha."
      : undefined;

  const destino =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  const contasDemo = demoHabilitado()
    ? CONTAS_DEMO.map(({ papel, rotulo, nome }) => ({ papel, rotulo, nome }))
    : undefined;

  return (
    <LoginForm
      erroInicial={erro}
      avisoInicial={aviso}
      destino={destino}
      contasDemo={contasDemo}
    />
  );
}