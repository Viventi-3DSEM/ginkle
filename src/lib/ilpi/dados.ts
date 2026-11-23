import { cache } from "react";
import { createClientOpcional } from "@/lib/supabase/server";
import { ILPIS_DEMO } from "./demo";
import type { IlpiCompleta, IlpiPublica } from "./tipos";

/** Linha crua da view ilpi_publica (numérico vem como string no PostgREST). */
type LinhaIlpi = {
  id_ilpi: string;
  slug: string;
  nome: string;
  cidade: string;
  bairro: string;
  uf: string;
  endereco: string;
  descricao: string | null;
  telefone: string;
  email: string;
  site: string | null;
  vagas: number;
  destaque: string | null;
  nota: number | string | null;
  total_avaliacoes: number | string | null;
  mensalidade: number | string | null;
  capa_url: string | null;
  tags?: string[] | null;
};

const numero = (valor: number | string | null | undefined, padrao = 0): number => {
  if (valor === null || valor === undefined) return padrao;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : padrao;
};

function mapear(linha: LinhaIlpi): IlpiPublica {
  return {
    slug: linha.slug,
    nome: linha.nome,
    cidade: linha.cidade,
    bairro: linha.bairro,
    uf: linha.uf,
    endereco: linha.endereco,
    descricao: linha.descricao ?? "",
    telefone: linha.telefone,
    email: linha.email,
    site: linha.site,
    vagas: linha.vagas,
    destaque: linha.destaque,
    nota: numero(linha.nota),
    totalAvaliacoes: numero(linha.total_avaliacoes),
    mensalidade:
      linha.mensalidade === null || linha.mensalidade === undefined
        ? null
        : numero(linha.mensalidade),
    capaUrl: linha.capa_url ?? "/images/casa.jpg",
    tags: linha.tags ?? [],
  };
}

/** Lista o diretório informando se veio do banco ou do catálogo demonstrativo. */
export async function listarIlpisComOrigem(): Promise<{ casas: IlpiPublica[]; demo: boolean }> {
  const supabase = await createClientOpcional();
  if (!supabase) return { casas: ILPIS_DEMO, demo: true };

  try {
    const { data, error } = await supabase
      .from("ilpi_publica")
      .select("*")
      .order("nome", { ascending: true });

    if (error || !data || data.length === 0) return { casas: ILPIS_DEMO, demo: true };
    return { casas: (data as LinhaIlpi[]).map(mapear), demo: false };
  } catch {
    return { casas: ILPIS_DEMO, demo: true };
  }
}

/** Lista o diretório. Sem banco (ou com erro), cai no catálogo demonstrativo. */
export async function listarIlpis(): Promise<IlpiPublica[]> {
  const { casas } = await listarIlpisComOrigem();
  return casas;
}

function demoCompleta(slug: string): IlpiCompleta | null {
  const base = ILPIS_DEMO.find((casa) => casa.slug === slug);
  if (!base) return null;
  return {
    ...base,
    fotos: [{ url: base.capaUrl, legenda: "Imagem ilustrativa" }],
    planos:
      base.mensalidade === null
        ? []
        : [{ nome: "Padrão", valor: base.mensalidade, descricao: null }],
    avaliacoes: [],
  };
}

/** Perfil completo de uma casa (memoizado entre generateMetadata e página). null = notFound. */
export const buscarIlpi = cache(async (slug: string): Promise<IlpiCompleta | null> => {
  const supabase = await createClientOpcional();
  if (!supabase) return demoCompleta(slug);

  try {
    const { data, error } = await supabase
      .from("ilpi_publica")
      .select("*")
      .eq("slug", slug)
      .maybeSingle<LinhaIlpi>();

    if (error) return demoCompleta(slug);
    // Com banco ativo e consulta bem-sucedida, casa ausente ou despublicada deve retornar 404.
    if (!data) return null;

    const [fotos, planos, avaliacoes] = await Promise.all([
      supabase
        .from("foto_ilpi")
        .select("url, legenda")
        .eq("id_ilpi", data.id_ilpi)
        .order("ordem", { ascending: true }),
      supabase
        .from("plano")
        .select("nome, valor, descricao")
        .eq("id_ilpi", data.id_ilpi)
        .eq("ativo", true)
        .order("valor", { ascending: true }),
      supabase
        .from("avaliacao_publica")
        .select("nota, comentario, autor, data_avaliacao")
        .eq("id_ilpi", data.id_ilpi)
        .order("data_avaliacao", { ascending: false })
        .limit(20),
    ]);

    return {
      ...mapear(data),
      fotos: (fotos.data ?? []).map((f) => ({
        url: f.url as string,
        legenda: (f.legenda as string | null) ?? null,
      })),
      planos: (planos.data ?? []).map((p) => ({
        nome: p.nome as string,
        valor: numero(p.valor as number | string),
        descricao: (p.descricao as string | null) ?? null,
      })),
      avaliacoes: (avaliacoes.data ?? []).map((a) => ({
        nota: numero(a.nota as number | string),
        comentario: (a.comentario as string | null) ?? null,
        autor: (a.autor as string) ?? "Familiar",
        data: (a.data_avaliacao as string) ?? "",
      })),
    };
  } catch {
    return demoCompleta(slug);
  }
});