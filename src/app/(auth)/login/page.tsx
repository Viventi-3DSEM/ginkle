import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { CONTAS_DEMO, demoHabilitado } from "@/lib/auth/demo";
import { destinoSeguro } from "@/lib/auth/destino";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o Ginkle para acompanhar os cuidados de quem você ama.",
};

const CODIGOS_DE_ERRO: Record<string, string> = {
  "link-invalido": "Este link não é válido. Peça um novo e-mail de recuperação.",
  "link-expirado": "O link expirou ou já foi usado. Peça um novo na tela de recuperação.",
  "acesso-negado": "Acesso não autorizado. Tente entrar novamente.",
  "erro-autenticacao": "Não foi possível concluir o acesso. Tente novamente.",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string; redefinida?: string }>;
}) {
  const params = await searchParams;

  // Aceita apenas códigos conhecidos: evita crash por decode duplo e spoofing via query string.
  const erro =
    params.erro === undefined
      ? undefined
      : (CODIGOS_DE_ERRO[params.erro] ?? CODIGOS_DE_ERRO["erro-autenticacao"]);

  const aviso =
    params.redefinida === "1"
      ? "Senha alterada. Entre com a nova senha."
      : undefined;

  const destino = destinoSeguro(params.next) ?? undefined;

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