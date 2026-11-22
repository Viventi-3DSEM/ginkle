"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { cargoDoUsuario, homePorCargo } from "@/lib/auth/sessao";
import { contaDemoPorPapel, demoHabilitado, senhaDemo } from "@/lib/auth/demo";
import { cpfValido, soDigitos } from "@/lib/validacao/cpf";
import { telefoneValido } from "@/lib/validacao/telefone";

export type Estado = { erro?: string; ok?: string };

const SEM_SUPABASE =
  "O Supabase ainda não está configurado. Preencha o .env.local para entrar.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Origem real da requisição, para o link do e-mail voltar ao host certo. */
async function origem(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function texto(form: FormData, campo: string): string {
  return String(form.get(campo) ?? "").trim();
}

function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered")) return "Este e-mail já tem uma conta.";
  if (m.includes("password should be")) return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Muitas tentativas em pouco tempo. Espere alguns minutos.";
  }
  if (m.includes("email address") && m.includes("invalid")) return "E-mail inválido.";
  return "Não foi possível concluir. Tente novamente.";
}

export async function entrar(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const email = texto(form, "email").toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const destino = texto(form, "next");

  if (!EMAIL_RE.test(email)) return { erro: "Informe um e-mail válido." };
  if (senha.length < 6) return { erro: "A senha precisa de pelo menos 6 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: traduzirErro(error.message) };

  const cargo = await cargoDoUsuario();
  const seguro = destino.startsWith("/") && !destino.startsWith("//") ? destino : null;
  redirect(seguro ?? homePorCargo(cargo));
}

// Entrada de demonstração (banca): o botão manda só o papel, e o servidor usa a
// senha do ambiente. Desligado por padrão — sem DEMO_HABILITADO=1 não entra.
export async function entrarDemo(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };
  if (!demoHabilitado()) return { erro: "As contas de demonstração estão desligadas." };

  const conta = contaDemoPorPapel(texto(form, "papel"));
  const senha = senhaDemo();
  if (!conta || !senha) return { erro: "Conta de demonstração inválida." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: conta.email,
    password: senha,
  });
  if (error) return { erro: traduzirErro(error.message) };

  const destino = texto(form, "next");
  const seguro = destino.startsWith("/") && !destino.startsWith("//") ? destino : null;
  redirect(seguro ?? homePorCargo(await cargoDoUsuario()));
}

export async function cadastrar(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const nome = texto(form, "nome");
  const email = texto(form, "email").toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const confirmar = String(form.get("confirmar") ?? "");
  const cpf = soDigitos(texto(form, "cpf"));
  const telefone = soDigitos(texto(form, "telefone"));

  if (nome.length < 3) return { erro: "Informe seu nome completo." };
  if (!EMAIL_RE.test(email)) return { erro: "Informe um e-mail válido." };
  if (!cpfValido(cpf)) return { erro: "Informe um CPF válido. Confira os números." };
  if (telefone.length > 0 && !telefoneValido(telefone)) {
    return { erro: "Telefone incompleto. Use DDD + número (10 ou 11 dígitos)." };
  }
  if (senha.length < 6) return { erro: "A senha precisa de pelo menos 6 caracteres." };
  if (senha !== confirmar) return { erro: "As senhas não conferem." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, cpf: cpf || null, telefone: telefone || null },
      emailRedirectTo: `${await origem()}/auth/callback?next=/cliente`,
    },
  });

  if (error) return { erro: traduzirErro(error.message) };

  // Sem confirmação de e-mail, o Supabase devolve sessão na hora.
  if (data.session) redirect("/cliente");

  return {
    ok: `Enviamos um link de confirmação para ${email}. Abra o e-mail para ativar a conta.`,
  };
}

// Responde sempre igual, exista ou não a conta: não vaza quais e-mails têm cadastro.
export async function recuperarSenha(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const email = texto(form, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { erro: "Informe um e-mail válido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origem()}/auth/callback?next=/redefinir-senha`,
  });

  return {
    ok: "Se este e-mail tiver uma conta, o link de redefinição chega em instantes. Confira também a caixa de spam.",
  };
}

export async function redefinirSenha(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const senha = String(form.get("senha") ?? "");
  const confirmar = String(form.get("confirmar") ?? "");

  if (senha.length < 6) return { erro: "A senha precisa de pelo menos 6 caracteres." };
  if (senha !== confirmar) return { erro: "As senhas não conferem." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "O link expirou ou já foi usado. Peça um novo em 'Esqueci minha senha'." };
  }

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: traduzirErro(error.message) };

  // Trocada a senha, encerra a sessão do link e pede login limpo.
  await supabase.auth.signOut();
  redirect("/login?redefinida=1");
}

export async function sair() {
  if (supabaseConfigurado()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}