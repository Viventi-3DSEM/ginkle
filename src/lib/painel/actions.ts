"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { soDigitos } from "@/lib/validacao/cpf";
import { cnpjValido, formatarCnpj } from "@/lib/validacao/cnpj";
import { formatarTelefone, telefoneValido } from "@/lib/validacao/telefone";
import { slugificar, slugValido } from "@/lib/validacao/slug";

export type Estado = { erro?: string; ok?: string };

const SEM_SUPABASE =
  "O Supabase ainda não está configurado. Preencha o .env.local para continuar.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DadosCasa = {
  nome: string;
  slug: string;
  cnpj: string;
  telefone: string;
  email: string;
  site: string | null;
  descricao: string | null;
  endereco: string;
  cidade: string;
  bairro: string;
  uf: string;
  vagas: number;
  destaque: string | null;
  tags: string[];
};

function texto(form: FormData, campo: string): string {
  return String(form.get(campo) ?? "").trim();
}

function listarTags(bruto: string): string[] {
  const vistas = new Set<string>();
  for (const parte of bruto.split(",")) {
    const tag = parte.trim().replace(/\s+/g, " ").slice(0, 40);
    if (tag) vistas.add(tag);
    if (vistas.size >= 6) break;
  }
  return [...vistas];
}

/**
 * Lê e valida o formulário da casa. `cnpjAtual` existe porque as casas do
 * protótipo foram semeadas com CNPJ de exemplo, sem dígito verificador:
 * um CNPJ que não mudou passa, um novo precisa ser válido.
 */
function ler(form: FormData): { dados?: DadosCasa; erro?: string } {
  const nome = texto(form, "nome");
  const cnpjBruto = texto(form, "cnpj");
  const telefoneBruto = texto(form, "telefone");
  const email = texto(form, "email").toLowerCase();
  const siteBruto = texto(form, "site");
  const endereco = texto(form, "endereco");
  const cidade = texto(form, "cidade");
  const bairro = texto(form, "bairro");
  const uf = texto(form, "uf").toUpperCase();
  const vagasBruto = texto(form, "vagas");
  const descricao = texto(form, "descricao");
  const destaque = texto(form, "destaque");
  const tags = listarTags(texto(form, "tags"));
  const cnpjAtual = soDigitos(texto(form, "cnpjAtual"));
  const slugBruto = texto(form, "slug");

  if (nome.length < 3) return { erro: "Informe o nome da instituição (3 letras ou mais)." };
  if (nome.length > 120) return { erro: "O nome ficou longo demais. Use até 120 caracteres." };

  const slug = slugBruto ? slugificar(slugBruto) : slugificar(nome);
  if (!slugValido(slug)) {
    return { erro: "O endereço da página (slug) aceita só letras, números e hífen." };
  }

  const cnpj = soDigitos(cnpjBruto);
  if (cnpj.length !== 14) return { erro: "O CNPJ precisa dos 14 dígitos." };
  if (cnpj !== cnpjAtual && !cnpjValido(cnpj)) {
    return { erro: "CNPJ inválido. Confira os dígitos verificadores." };
  }

  const telefone = soDigitos(telefoneBruto);
  if (!telefoneValido(telefone)) {
    return { erro: "Telefone incompleto. Use DDD + número (10 ou 11 dígitos)." };
  }

  if (!EMAIL_RE.test(email)) return { erro: "Informe um e-mail de contato válido." };
  if (endereco.length < 5) return { erro: "Informe o endereço (rua e número)." };
  if (cidade.length < 2) return { erro: "Informe a cidade." };
  if (bairro.length < 2) return { erro: "Informe o bairro." };
  if (!/^[A-Z]{2}$/.test(uf)) return { erro: "Informe a UF com duas letras (ex.: SP)." };
  if (descricao.length > 2000) return { erro: "A descrição passa de 2000 caracteres." };
  if (destaque.length > 40) return { erro: "O selo de destaque aceita até 40 caracteres." };

  const vagas = Number(vagasBruto || "0");
  if (!Number.isInteger(vagas) || vagas < 0 || vagas > 500) {
    return { erro: "As vagas precisam ser um número entre 0 e 500." };
  }

  let site: string | null = siteBruto || null;
  if (site) {
    if (!/^https?:\/\//i.test(site)) site = `https://${site}`;
    if (site.length > 200) return { erro: "O site ficou longo demais." };
  }

  return {
    dados: {
      nome,
      slug,
      cnpj: formatarCnpj(cnpj),
      telefone: formatarTelefone(telefone),
      email,
      site,
      descricao: descricao || null,
      endereco,
      cidade,
      bairro,
      uf,
      vagas,
      destaque: destaque || null,
      tags,
    },
  };
}

function mensagemErro(erro: { code?: string; message?: string; details?: string }): string {
  const texto = `${erro.message ?? ""} ${erro.details ?? ""}`;
  if (erro.code === "23505" || texto.includes("duplicate key")) {
    if (texto.includes("slug")) return "Já existe uma casa com esse endereço de página. Escolha outro.";
    if (texto.includes("cnpj")) return "Já existe uma casa cadastrada com esse CNPJ.";
    return "Já existe um registro com esses dados.";
  }
  if (erro.code === "23514") return "Algum campo ficou fora do formato aceito. Revise e tente de novo.";
  if (erro.code === "42501" || erro.code === "42P01") {
    return "Você não tem permissão para essa alteração.";
  }
  return "Não foi possível salvar. Tente novamente.";
}

/** Cria a casa e o vínculo de gestor (a RPC faz as duas coisas na mesma transação). */
export async function criarCasa(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const { dados, erro } = ler(form);
  if (!dados) return { erro: erro ?? "Revise os dados." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("criar_ilpi", {
    p_slug: dados.slug,
    p_cnpj: dados.cnpj,
    p_nome: dados.nome,
    p_telefone: dados.telefone,
    p_email: dados.email,
    p_endereco: dados.endereco,
    p_cidade: dados.cidade,
    p_bairro: dados.bairro,
    p_descricao: dados.descricao,
    p_site: dados.site,
    p_uf: dados.uf,
  });

  if (error) return { erro: mensagemErro(error) };

  const id = String(data);
  // vagas, selo de destaque e tags não fazem parte da RPC de criação.
  const { error: erroExtras } = await supabase
    .from("ilpi")
    .update({ vagas: dados.vagas, destaque: dados.destaque, tags: dados.tags })
    .eq("id_ilpi", id)
    .select("id_ilpi");

  revalidatePath("/gerente");
  revalidatePath("/gerente/casas");
  revalidatePath("/casas");

  if (erroExtras) {
    return {
      ok: "Casa criada. Faltou salvar vagas e tags: abra a edição para completar.",
    };
  }

  redirect(`/gerente/casas/${id}`);
}

export async function atualizarCasa(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  if (!UUID_RE.test(id)) return { erro: "Casa não encontrada." };

  const { dados, erro } = ler(form);
  if (!dados) return { erro: erro ?? "Revise os dados." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ilpi")
    .update({
      slug: dados.slug,
      cnpj: dados.cnpj,
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      site: dados.site,
      descricao: dados.descricao,
      endereco: dados.endereco,
      cidade: dados.cidade,
      bairro: dados.bairro,
      uf: dados.uf,
      vagas: dados.vagas,
      destaque: dados.destaque,
      tags: dados.tags,
    })
    .eq("id_ilpi", id)
    .select("id_ilpi");

  if (error) return { erro: mensagemErro(error) };
  if (!data || data.length === 0) {
    return { erro: "Você não é gestor desta casa." };
  }

  revalidatePath("/gerente");
  revalidatePath(`/gerente/casas/${id}`);
  revalidatePath("/casas");
  revalidatePath(`/casas/${dados.slug}`);

  redirect(`/gerente/casas/${id}`);
}

/** Publicar/rascunho. Form action direto: sem estado, a página é que se atualiza. */
export async function alternarPublicado(form: FormData): Promise<void> {
  const id = String(form.get("id") ?? "");
  const publicado = String(form.get("publicado") ?? "") === "true";
  if (!UUID_RE.test(id) || !supabaseConfigurado()) return;

  const supabase = await createClient();
  await supabase
    .from("ilpi")
    .update({ publicado })
    .eq("id_ilpi", id)
    .select("id_ilpi");

  revalidatePath("/gerente");
  revalidatePath("/gerente/casas");
  revalidatePath(`/gerente/casas/${id}`);
  revalidatePath("/casas");
}
