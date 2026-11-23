"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { cpfValido, soDigitos } from "@/lib/validacao/cpf";
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

  await definirVisibilidade(id, publicado);
}

export async function definirVisibilidade(
  id: string,
  publicado: boolean,
): Promise<{ erro?: string; publicado: boolean }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE, publicado: !publicado };
  if (!UUID_RE.test(id)) return { erro: "Casa não encontrada.", publicado: !publicado };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ilpi")
    .update({ publicado })
    .eq("id_ilpi", id)
    .select("id_ilpi, slug");

  if (error) return { erro: mensagemErro(error), publicado: !publicado };
  const linha = (data ?? []) as unknown as { id_ilpi: string; slug: string }[];
  if (linha.length === 0) {
    return { erro: "Você não tem permissão para alterar esta casa.", publicado: !publicado };
  }

  revalidatePath("/gerente");
  revalidatePath("/gerente/casas");
  revalidatePath(`/gerente/casas/${id}`);
  revalidatePath("/casas");
  if (linha[0]?.slug) revalidatePath(`/casas/${linha[0].slug}`);

  return { publicado };
}

function lerValorPlano(bruto: string): number | null {
  const limpo = bruto.replace(/R\$/gi, "").replace(/\s+/g, "");
  if (!limpo) return null;

  let normalizado = limpo;
  if (limpo.includes(".") && limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (limpo.includes(",")) {
    normalizado = limpo.replace(",", ".");
  }

  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || valor < 0 || valor > 999999.99) return null;
  return Math.round(valor * 100) / 100;
}

function lerDadosPlano(form: FormData): {
  dados?: { nome: string; valor: number; descricao: string | null };
  erro?: string;
} {
  const nome = texto(form, "nome");
  const valorBruto = texto(form, "valor");
  const descricao = texto(form, "descricao");

  if (nome.length < 2) return { erro: "Informe o nome do plano (pelo menos 2 caracteres)." };
  if (nome.length > 80) return { erro: "O nome do plano aceita até 80 caracteres." };

  const valor = lerValorPlano(valorBruto);
  if (valor === null) {
    return { erro: "Informe uma mensalidade válida (ex.: 3.200,00)." };
  }

  if (descricao.length > 300) {
    return { erro: "A descrição do plano aceita até 300 caracteres." };
  }

  return { dados: { nome, valor, descricao: descricao || null } };
}

function revalidarPlanos(casaId: string, slug?: string | null) {
  revalidatePath("/gerente");
  revalidatePath("/gerente/planos");
  revalidatePath("/gerente/casas");
  revalidatePath(`/gerente/casas/${casaId}`);
  revalidatePath("/casas");
  if (slug) revalidatePath(`/casas/${slug}`);
}

export async function criarPlano(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const casaId = texto(form, "casaId");
  if (!UUID_RE.test(casaId)) return { erro: "Selecione uma casa válida." };

  const { dados, erro } = lerDadosPlano(form);
  if (!dados) return { erro: erro ?? "Revise os dados do plano." };

  const supabase = await createClient();
  const { error } = await supabase.from("plano").insert({
    id_ilpi: casaId,
    nome: dados.nome,
    valor: dados.valor,
    descricao: dados.descricao,
    ativo: true,
  });

  if (error) return { erro: mensagemErro(error) };

  const { data: casa } = await supabase
    .from("ilpi")
    .select("slug")
    .eq("id_ilpi", casaId)
    .maybeSingle();

  revalidarPlanos(casaId, (casa?.slug as string | undefined) ?? null);
  return { ok: `Plano "${dados.nome}" adicionado.` };
}

export async function atualizarPlano(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  const casaId = texto(form, "casaId");
  if (!UUID_RE.test(id) || !UUID_RE.test(casaId)) return { erro: "Plano não encontrado." };

  const { dados, erro } = lerDadosPlano(form);
  if (!dados) return { erro: erro ?? "Revise os dados do plano." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plano")
    .update({
      nome: dados.nome,
      valor: dados.valor,
      descricao: dados.descricao,
    })
    .eq("id_plano", id)
    .eq("id_ilpi", casaId)
    .select("id_plano");

  if (error) return { erro: mensagemErro(error) };
  if (!data || data.length === 0) return { erro: "Plano não encontrado ou sem permissão." };

  const { data: casa } = await supabase
    .from("ilpi")
    .select("slug")
    .eq("id_ilpi", casaId)
    .maybeSingle();

  revalidarPlanos(casaId, (casa?.slug as string | undefined) ?? null);
  return { ok: `Plano "${dados.nome}" atualizado.` };
}

export async function alternarPlanoAtivo(
  id: string,
  casaId: string,
  ativo: boolean,
): Promise<{ erro?: string; ativo: boolean }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE, ativo: !ativo };
  if (!UUID_RE.test(id) || !UUID_RE.test(casaId)) {
    return { erro: "Plano não encontrado.", ativo: !ativo };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plano")
    .update({ ativo })
    .eq("id_plano", id)
    .eq("id_ilpi", casaId)
    .select("id_plano");

  if (error) return { erro: mensagemErro(error), ativo: !ativo };
  if (!data || data.length === 0) {
    return { erro: "Você não tem permissão para alterar este plano.", ativo: !ativo };
  }

  const { data: casa } = await supabase
    .from("ilpi")
    .select("slug")
    .eq("id_ilpi", casaId)
    .maybeSingle();

  revalidarPlanos(casaId, (casa?.slug as string | undefined) ?? null);
  return { ativo };
}

export async function excluirPlano(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  const casaId = texto(form, "casaId");
  if (!UUID_RE.test(id) || !UUID_RE.test(casaId)) return { erro: "Plano não encontrado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plano")
    .delete()
    .eq("id_plano", id)
    .eq("id_ilpi", casaId)
    .select("id_plano");

  if (error) {
    if (error.code === "23503") {
      return {
        erro: "Este plano está vinculado a assinaturas e não pode ser excluído. Desative-o para deixar de oferecê-lo.",
      };
    }
    return { erro: mensagemErro(error) };
  }

  if (!data || data.length === 0) return { erro: "Plano não encontrado ou sem permissão." };

  const { data: casa } = await supabase
    .from("ilpi")
    .select("slug")
    .eq("id_ilpi", casaId)
    .maybeSingle();

  revalidarPlanos(casaId, (casa?.slug as string | undefined) ?? null);
  return { ok: "Plano excluído." };
}

const DATA_PURA_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_RESIDENTE_VALIDOS = new Set(["ATIVO", "INATIVO", "ALTA", "OBITO"]);
const SEXOS_VALIDOS = new Set(["M", "F", "O"]);

function dataValida(valor: string): boolean {
  if (!DATA_PURA_RE.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
  );
}

function revalidarResidentes(casaId: string, residenteId?: string) {
  revalidatePath("/gerente");
  revalidatePath("/gerente/residentes");
  revalidatePath("/gerente/casas");
  revalidatePath(`/gerente/casas/${casaId}`);
  revalidatePath("/cliente");
  revalidatePath("/cliente/residentes");
  revalidatePath("/cliente/solicitacoes");
  if (residenteId) revalidatePath(`/cliente/residentes/${residenteId}`);
}

function lerDadosResidente(form: FormData, cpfAtual?: string): {
  dados?: {
    nome: string;
    cpf: string;
    nascimento: string;
    sexo: string;
    ingresso: string;
    status: string;
    observacoesMedicas: string | null;
  };
  erro?: string;
} {
  const nome = texto(form, "nome");
  const cpf = soDigitos(texto(form, "cpf"));
  const nascimento = texto(form, "nascimento");
  const sexo = texto(form, "sexo").toUpperCase();
  const ingresso = texto(form, "ingresso");
  const status = texto(form, "status").toUpperCase() || "ATIVO";
  const observacoes = texto(form, "observacoesMedicas");

  if (nome.length < 3) return { erro: "Informe o nome completo do residente." };
  if (nome.length > 120) return { erro: "O nome aceita até 120 caracteres." };
  if (cpf.length !== 11) return { erro: "O CPF precisa ter 11 dígitos." };
  if (cpf !== cpfAtual && !cpfValido(cpf)) {
    return { erro: "CPF inválido. Confira os números." };
  }
  if (!dataValida(nascimento)) return { erro: "Informe uma data de nascimento válida." };
  if (!SEXOS_VALIDOS.has(sexo)) return { erro: "Selecione o sexo do residente." };
  if (!dataValida(ingresso)) return { erro: "Informe uma data de ingresso válida." };
  if (!STATUS_RESIDENTE_VALIDOS.has(status)) return { erro: "Situação inválida." };
  if (observacoes.length > 2000) {
    return { erro: "As observações médicas aceitam até 2000 caracteres." };
  }

  const hojeIso = new Date().toISOString().slice(0, 10);
  if (nascimento > hojeIso) {
    return { erro: "A data de nascimento não pode estar no futuro." };
  }

  return {
    dados: {
      nome,
      cpf,
      nascimento,
      sexo,
      ingresso,
      status,
      observacoesMedicas: observacoes || null,
    },
  };
}

export async function criarResidente(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const casaId = texto(form, "casaId");
  if (!UUID_RE.test(casaId)) return { erro: "Selecione uma casa válida." };

  const { dados, erro } = lerDadosResidente(form);
  if (!dados) return { erro: erro ?? "Revise os dados do residente." };

  const supabase = await createClient();
  // Sem `.select()`: RETURNING em residente estoura 42501 porque a policy de
  // SELECT (`pode_ver_residente`) consulta residente por subquery no mesmo snapshot.
  const { error } = await supabase.from("residente").insert({
    id_ilpi: casaId,
    nome: dados.nome,
    cpf: dados.cpf,
    data_nascimento: dados.nascimento,
    sexo: dados.sexo,
    data_ingresso: dados.ingresso,
    status: "ATIVO",
    observacoes_medicas: dados.observacoesMedicas,
  });

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um residente cadastrado com este CPF." };
    }
    return { erro: mensagemErro(error) };
  }

  revalidarResidentes(casaId);
  return { ok: `Residente "${dados.nome}" cadastrado.` };
}

export async function atualizarResidente(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  const casaId = texto(form, "casaId");
  const cpfAtual = soDigitos(texto(form, "cpfAtual"));
  if (!UUID_RE.test(id) || !UUID_RE.test(casaId)) return { erro: "Residente não encontrado." };

  const { dados, erro } = lerDadosResidente(form, cpfAtual);
  if (!dados) return { erro: erro ?? "Revise os dados do residente." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("residente")
    .update({
      nome: dados.nome,
      cpf: dados.cpf,
      data_nascimento: dados.nascimento,
      sexo: dados.sexo,
      data_ingresso: dados.ingresso,
      status: dados.status,
      observacoes_medicas: dados.observacoesMedicas,
    })
    .eq("id_residente", id)
    .eq("id_ilpi", casaId)
    .select("id_residente");

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe outro residente cadastrado com este CPF." };
    }
    return { erro: mensagemErro(error) };
  }
  if (!data || data.length === 0) {
    return { erro: "Residente não encontrado ou sem permissão." };
  }

  revalidarResidentes(casaId, id);
  return { ok: `Ficha de "${dados.nome}" atualizada.` };
}

export async function vincularFamiliar(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const residenteId = texto(form, "residenteId");
  const casaId = texto(form, "casaId");
  const email = texto(form, "email").toLowerCase();
  const parentesco = texto(form, "parentesco");
  const responsavelPrincipal =
    form.get("responsavelPrincipal") === "on" || form.get("responsavelPrincipal") === "true";

  if (!UUID_RE.test(residenteId) || !UUID_RE.test(casaId)) {
    return { erro: "Residente não encontrado." };
  }
  if (!EMAIL_RE.test(email)) return { erro: "Informe o e-mail da conta do familiar." };
  if (parentesco.length < 2 || parentesco.length > 60) {
    return { erro: "Informe o parentesco (ex.: Filha, Sobrinho)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("vincular_familiar_por_email", {
    p_residente: residenteId,
    p_email: email,
    p_parentesco: parentesco,
    p_responsavel_principal: responsavelPrincipal,
  });

  if (error) {
    if (error.code === "P0002") {
      return {
        erro: "Nenhuma conta encontrada com esse e-mail. O familiar precisa criar conta no Ginkle primeiro.",
      };
    }
    if (error.code === "42501") {
      return { erro: "Você não tem permissão para vincular familiares a este residente." };
    }
    if (error.code === "22023") return { erro: error.message };
    return { erro: "Não foi possível vincular o familiar. Tente novamente." };
  }

  revalidarResidentes(casaId, residenteId);
  return { ok: "Familiar vinculado ao residente." };
}

export async function removerFamiliar(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  const casaId = texto(form, "casaId");
  const residenteId = texto(form, "residenteId");
  if (!UUID_RE.test(id) || !UUID_RE.test(casaId)) return { erro: "Vínculo não encontrado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("familiar_residente")
    .delete()
    .eq("id_familiar_residente", id)
    .select("id_familiar_residente");

  if (error) return { erro: mensagemErro(error) };
  if (!data || data.length === 0) return { erro: "Vínculo não encontrado ou sem permissão." };

  revalidarResidentes(casaId, UUID_RE.test(residenteId) ? residenteId : undefined);
  return { ok: "Vínculo familiar removido." };
}

export async function responderSolicitacao(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  const casaId = texto(form, "casaId");
  const decisao = texto(form, "decisao").toUpperCase();
  const residenteId = texto(form, "residenteId");
  const parentesco = texto(form, "parentesco");
  const responsavelPrincipal = form.get("responsavelPrincipal") === "on";

  if (!UUID_RE.test(id) || !UUID_RE.test(casaId)) return { erro: "Solicitação não encontrada." };
  if (decisao !== "APROVADA" && decisao !== "RECUSADA") {
    return { erro: "Decisão inválida." };
  }

  if (decisao === "APROVADA" && residenteId) {
    if (!UUID_RE.test(residenteId)) return { erro: "Residente selecionado inválido." };
    if (parentesco.length < 2 || parentesco.length > 60) {
      return { erro: "Informe o parentesco para vincular o familiar ao residente." };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adesao_ilpi")
    .update({ status: decisao, data_resposta: new Date().toISOString() })
    .eq("id_adesao", id)
    .eq("id_ilpi", casaId)
    .eq("status", "PENDENTE")
    .select("id_adesao, id_usuario");

  if (error) return { erro: mensagemErro(error) };
  const atualizada = (data ?? []) as unknown as { id_adesao: string; id_usuario: string }[];
  if (atualizada.length === 0) {
    return { erro: "Esta solicitação não está mais pendente ou não foi encontrada." };
  }

  if (decisao === "APROVADA" && residenteId) {
    const { error: erroVinculo } = await supabase
      .from("familiar_residente")
      .upsert(
        {
          id_usuario: atualizada[0].id_usuario,
          id_residente: residenteId,
          parentesco,
          responsavel_principal: responsavelPrincipal,
        },
        { onConflict: "id_usuario,id_residente" },
      );

    revalidarResidentes(casaId, residenteId);
    if (erroVinculo) {
      return {
        ok: "Solicitação aprovada, mas não foi possível vincular ao residente agora. Vincule pela ficha do residente.",
      };
    }
    return { ok: "Solicitação aprovada e familiar vinculado ao residente." };
  }

  revalidarResidentes(casaId);
  return {
    ok:
      decisao === "APROVADA"
        ? "Solicitação aprovada. Você pode vincular a família a um residente na ficha dele."
        : "Solicitação recusada.",
  };
}

function revalidarEquipe(casaId: string) {
  revalidatePath("/gerente");
  revalidatePath("/gerente/equipe");
  revalidatePath("/gerente/casas");
  revalidatePath(`/gerente/casas/${casaId}`);
}

export async function adicionarMembroEquipe(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const casaId = texto(form, "casaId");
  const email = texto(form, "email").toLowerCase();
  const cargo = texto(form, "cargo").toUpperCase();

  if (!UUID_RE.test(casaId)) return { erro: "Selecione uma casa válida." };
  if (!EMAIL_RE.test(email)) return { erro: "Informe um e-mail válido." };
  if (cargo !== "GESTOR" && cargo !== "FUNCIONARIO") return { erro: "Selecione um cargo válido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("vincular_equipe_por_email", {
    p_ilpi: casaId,
    p_email: email,
    p_cargo: cargo,
  });

  if (error) {
    if (error.code === "P0002") {
      return {
        erro: "Nenhuma conta encontrada com esse e-mail. O profissional precisa criar conta no Ginkle primeiro.",
      };
    }
    if (error.code === "42501") {
      return { erro: "Apenas gestores podem gerenciar a equipe desta casa." };
    }
    if (error.code === "22023") return { erro: error.message };
    return { erro: "Não foi possível adicionar o profissional. Tente novamente." };
  }

  revalidarEquipe(casaId);
  return { ok: "Profissional adicionado à equipe." };
}

export async function alterarCargoEquipe(
  idVinculo: string,
  casaId: string,
  cargo: string,
): Promise<{ erro?: string; ok?: string }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };
  const cargoNorm = cargo.toUpperCase();
  if (!UUID_RE.test(idVinculo) || !UUID_RE.test(casaId)) {
    return { erro: "Vínculo não encontrado." };
  }
  if (cargoNorm !== "GESTOR" && cargoNorm !== "FUNCIONARIO") {
    return { erro: "Cargo inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data: alvo } = await supabase
    .from("vinculo_ilpi")
    .select("id_usuario, cargo")
    .eq("id_vinculo", idVinculo)
    .eq("id_ilpi", casaId)
    .maybeSingle();

  if (!alvo) return { erro: "Vínculo não encontrado." };
  if ((alvo.id_usuario as string) === user.id) {
    return { erro: "Você não pode alterar o próprio cargo." };
  }

  const { data, error } = await supabase
    .from("vinculo_ilpi")
    .update({ cargo: cargoNorm })
    .eq("id_vinculo", idVinculo)
    .eq("id_ilpi", casaId)
    .select("id_vinculo");

  if (error) return { erro: mensagemErro(error) };
  if (!data || data.length === 0) return { erro: "Sem permissão para alterar este vínculo." };

  revalidarEquipe(casaId);
  return { ok: "Cargo atualizado." };
}

export async function alternarAtivoEquipe(
  idVinculo: string,
  casaId: string,
  ativo: boolean,
): Promise<{ erro?: string; ativo: boolean }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE, ativo: !ativo };
  if (!UUID_RE.test(idVinculo) || !UUID_RE.test(casaId)) {
    return { erro: "Vínculo não encontrado.", ativo: !ativo };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente.", ativo: !ativo };

  if (!ativo) {
    const { data: alvo } = await supabase
      .from("vinculo_ilpi")
      .select("id_usuario")
      .eq("id_vinculo", idVinculo)
      .eq("id_ilpi", casaId)
      .maybeSingle();

    if (alvo && (alvo.id_usuario as string) === user.id) {
      return { erro: "Você não pode desativar o próprio acesso.", ativo: true };
    }
  }

  const { data, error } = await supabase
    .from("vinculo_ilpi")
    .update({ ativo })
    .eq("id_vinculo", idVinculo)
    .eq("id_ilpi", casaId)
    .select("id_vinculo");

  if (error) return { erro: mensagemErro(error), ativo: !ativo };
  if (!data || data.length === 0) {
    return { erro: "Sem permissão para alterar este vínculo.", ativo: !ativo };
  }

  revalidarEquipe(casaId);
  return { ativo };
}

export async function removerMembroEquipe(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  const casaId = texto(form, "casaId");
  if (!UUID_RE.test(id) || !UUID_RE.test(casaId)) return { erro: "Vínculo não encontrado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data: alvo } = await supabase
    .from("vinculo_ilpi")
    .select("id_usuario")
    .eq("id_vinculo", id)
    .eq("id_ilpi", casaId)
    .maybeSingle();

  if (!alvo) return { erro: "Vínculo não encontrado." };
  if ((alvo.id_usuario as string) === user.id) {
    return { erro: "Você não pode remover o próprio vínculo." };
  }

  const { data, error } = await supabase
    .from("vinculo_ilpi")
    .delete()
    .eq("id_vinculo", id)
    .eq("id_ilpi", casaId)
    .select("id_vinculo");

  if (error) {
    if (error.code === "23503") {
      return {
        erro: "Este profissional já possui registros de cuidados e não pode ser removido. Desative o acesso pelo controle de ativação.",
      };
    }
    return { erro: mensagemErro(error) };
  }
  if (!data || data.length === 0) return { erro: "Sem permissão para remover este vínculo." };

  revalidarEquipe(casaId);
  return { ok: "Profissional removido da equipe." };
}

const STATUS_ASSINATURA_VALIDOS = new Set(["ATIVA", "SUSPENSA", "CANCELADA"]);
const STATUS_FATURA_VALIDOS = new Set(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"]);

function hojeBrasiliaIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function revalidarFinanceiro() {
  revalidatePath("/gerente");
  revalidatePath("/gerente/financeiro");
  revalidatePath("/cliente");
}

export async function criarAssinatura(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const usuarioId = texto(form, "usuarioId");
  const planoId = texto(form, "planoId");
  const dataInicio = texto(form, "dataInicio") || hojeBrasiliaIso();
  const gerarFatura = form.get("gerarPrimeiraFatura") === "on";
  const dataVencimento = texto(form, "dataVencimento");

  if (!UUID_RE.test(usuarioId)) return { erro: "Selecione o familiar assinante." };
  if (!UUID_RE.test(planoId)) return { erro: "Selecione um plano válido." };
  if (!dataValida(dataInicio)) return { erro: "Informe uma data de início válida." };
  if (gerarFatura && !dataValida(dataVencimento)) {
    return { erro: "Informe a data de vencimento da primeira fatura." };
  }

  const supabase = await createClient();
  const { data: plano } = await supabase
    .from("plano")
    .select("id_plano, nome, valor")
    .eq("id_plano", planoId)
    .maybeSingle();

  if (!plano) return { erro: "Plano não encontrado." };

  const { data: criada, error } = await supabase
    .from("assinatura")
    .insert({
      id_usuario: usuarioId,
      id_plano: planoId,
      status: "ATIVA",
      data_inicio: dataInicio,
    })
    .select("id_assinatura")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        erro: "Esta pessoa já possui uma assinatura ativa. Suspenda ou cancele a atual antes de criar outra.",
      };
    }
    if (error.code === "42501") {
      return {
        erro: "O assinante precisa estar vinculado a um residente ou ter uma solicitação nesta casa.",
      };
    }
    return { erro: mensagemErro(error) };
  }

  if (gerarFatura && criada) {
    const valorPlano = Number(plano.valor ?? 0);
    const { error: erroFat } = await supabase.from("faturamento").insert({
      id_assinatura: (criada as { id_assinatura: string }).id_assinatura,
      valor: Number.isFinite(valorPlano) ? valorPlano : 0,
      data_vencimento: dataVencimento,
      status_pagamento: "PENDENTE",
    });

    revalidarFinanceiro();
    if (erroFat) {
      return {
        ok: "Assinatura criada, mas não foi possível gerar a primeira fatura agora. Lance manualmente abaixo.",
      };
    }
    return { ok: "Assinatura criada e primeira fatura lançada." };
  }

  revalidarFinanceiro();
  return { ok: "Assinatura criada." };
}

export async function atualizarStatusAssinatura(
  idAssinatura: string,
  status: string,
): Promise<{ erro?: string; ok?: string }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };
  const statusNorm = status.toUpperCase();
  if (!UUID_RE.test(idAssinatura)) return { erro: "Assinatura não encontrada." };
  if (!STATUS_ASSINATURA_VALIDOS.has(statusNorm)) return { erro: "Situação inválida." };

  const supabase = await createClient();
  const payload =
    statusNorm === "CANCELADA"
      ? { status: statusNorm, data_fim: hojeBrasiliaIso() }
      : statusNorm === "ATIVA"
        ? { status: statusNorm, data_fim: null }
        : { status: statusNorm };

  const { data, error } = await supabase
    .from("assinatura")
    .update(payload)
    .eq("id_assinatura", idAssinatura)
    .select("id_assinatura");

  if (error) {
    if (error.code === "23505") {
      return { erro: "Este assinante já possui outra assinatura ativa." };
    }
    return { erro: mensagemErro(error) };
  }
  if (!data || data.length === 0) return { erro: "Sem permissão para alterar esta assinatura." };

  revalidarFinanceiro();
  return { ok: "Situação da assinatura atualizada." };
}

export async function criarFatura(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const assinaturaId = texto(form, "assinaturaId");
  const valor = lerValorPlano(texto(form, "valor"));
  const vencimento = texto(form, "dataVencimento");
  const statusInicial = texto(form, "status").toUpperCase() || "PENDENTE";

  if (!UUID_RE.test(assinaturaId)) return { erro: "Assinatura não encontrada." };
  if (valor === null) return { erro: "Informe um valor válido (ex.: 3.200,00)." };
  if (!dataValida(vencimento)) return { erro: "Informe uma data de vencimento válida." };
  if (!STATUS_FATURA_VALIDOS.has(statusInicial)) return { erro: "Situação inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("faturamento").insert({
    id_assinatura: assinaturaId,
    valor,
    data_vencimento: vencimento,
    status_pagamento: statusInicial,
    data_pagamento: statusInicial === "PAGO" ? hojeBrasiliaIso() : null,
  });

  if (error) return { erro: mensagemErro(error) };

  revalidarFinanceiro();
  return { ok: "Fatura lançada." };
}

export async function atualizarStatusFatura(
  idFatura: string,
  statusPagamento: string,
): Promise<{ erro?: string; ok?: string }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };
  const statusNorm = statusPagamento.toUpperCase();
  if (!UUID_RE.test(idFatura)) return { erro: "Fatura não encontrada." };
  if (!STATUS_FATURA_VALIDOS.has(statusNorm)) return { erro: "Situação inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faturamento")
    .update({
      status_pagamento: statusNorm,
      data_pagamento: statusNorm === "PAGO" ? hojeBrasiliaIso() : null,
    })
    .eq("id_faturamento", idFatura)
    .select("id_faturamento");

  if (error) return { erro: mensagemErro(error) };
  if (!data || data.length === 0) return { erro: "Sem permissão para alterar esta fatura." };

  revalidarFinanceiro();
  return { ok: "Fatura atualizada." };
}

export async function atualizarPerfil(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const nome = texto(form, "nome");
  const telDigitos = soDigitos(texto(form, "telefone"));
  const dataNascimento = texto(form, "dataNascimento");

  if (nome.length < 3 || nome.length > 120) {
    return { erro: "Informe seu nome completo (entre 3 e 120 caracteres)." };
  }
  if (telDigitos.length > 0 && !telefoneValido(telDigitos)) {
    return { erro: "Telefone incompleto. Use DDD + número (10 ou 11 dígitos)." };
  }
  if (dataNascimento.length > 0) {
    if (!dataValida(dataNascimento) || dataNascimento > hojeBrasiliaIso()) {
      return { erro: "Informe uma data de nascimento válida." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { error } = await supabase
    .from("usuario")
    .update({
      nome,
      telefone: telDigitos || null,
      data_nascimento: dataNascimento || null,
    })
    .eq("id_usuario", user.id);

  if (error) return { erro: mensagemErro(error) };

  revalidatePath("/gerente", "layout");
  revalidatePath("/gerente/perfil");
  revalidatePath("/cliente", "layout");
  return { ok: "Dados pessoais atualizados." };
}

export async function alterarSenha(_estado: Estado, form: FormData): Promise<Estado> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const senhaAtual = String(form.get("senhaAtual") ?? "");
  const novaSenha = String(form.get("novaSenha") ?? "");

  if (senhaAtual.length < 6) return { erro: "Informe sua senha atual." };
  if (novaSenha.length < 6) return { erro: "A nova senha precisa de pelo menos 6 caracteres." };
  if (novaSenha === senhaAtual) {
    return { erro: "A nova senha precisa ser diferente da atual." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { erro: "Sua sessão expirou. Entre novamente." };

  const { error: erroConfirma } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  });
  if (erroConfirma) {
    const m = erroConfirma.message.toLowerCase();
    if (m.includes("rate limit") || m.includes("too many")) {
      return { erro: "Muitas tentativas em pouco tempo. Espere alguns minutos." };
    }
    return { erro: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("same password") || m.includes("different from the old")) {
      return { erro: "A nova senha precisa ser diferente da atual." };
    }
    if (m.includes("password should be")) {
      return { erro: "A nova senha precisa de pelo menos 6 caracteres." };
    }
    return { erro: "Não foi possível atualizar a senha agora. Tente novamente." };
  }

  return { ok: "Senha atualizada com sucesso." };
}
