import { cache } from "react";
import { createClientOpcional, sessaoAtual } from "@/lib/supabase/server";

/**
 * Camada de leitura do Portal do Familiar. Usa apenas a sessão do usuário:
 * o isolamento vem da RLS (familiar_residente, residente e view registro_timeline).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UsuarioDoPortal = { nome: string; email: string; avatarUrl: string | null };

export type CasaDoResidente = {
  id: string;
  slug: string;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  endereco: string;
  telefone: string;
  email: string;
  publicado: boolean;
  capaUrl: string | null;
};

export type RegistroTimeline = {
  id: string;
  residenteId: string;
  residenteNome: string;
  tipo: string;
  titulo: string;
  descricao: string;
  criadoEm: string;
  sincronizadoEm: string;
  atrasado: boolean;
  autorNome: string;
  autorCargo: string;
};

export type ResidenteVinculado = {
  id: string;
  nome: string;
  nascimento: string;
  sexo: string;
  ingresso: string;
  status: string;
  observacoesMedicas: string | null;
  parentesco: string;
  responsavelPrincipal: boolean;
  casa: CasaDoResidente | null;
  registros7d: number;
  ultimoRegistro: {
    tipo: string;
    titulo: string;
    quando: string;
    autorNome: string;
  } | null;
};

export type AdesaoDoFamiliar = {
  id: string;
  casaId: string;
  casaNome: string;
  casaSlug: string | null;
  casaBairro: string | null;
  casaCidade: string | null;
  casaUf: string | null;
  casaCapaUrl: string | null;
  casaPublicada: boolean;
  status: string;
  quando: string;
  respondidaEm: string | null;
};

export type CasaDisponivel = {
  id: string;
  slug: string;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  vagas: number;
  capaUrl: string | null;
};

export type SolicitacoesDoFamiliar = {
  adesoes: AdesaoDoFamiliar[];
  casasDisponiveis: CasaDisponivel[];
  casasVinculadasIds: string[];
  resumo: {
    total: number;
    pendentes: number;
    aprovadas: number;
    recusadas: number;
    canceladas: number;
  };
};

export type ResumoFamiliar = {
  residentes: number;
  residentesAtivos: number;
  registros7d: number;
  ultimaAtualizacao: string | null;
  adesoesPendentes: number;
};

export type PortalDoFamiliar = {
  residentes: ResidenteVinculado[];
  resumo: ResumoFamiliar;
  atividade: RegistroTimeline[];
  adesoes: AdesaoDoFamiliar[];
};

export type ResidenteDetalhe = {
  id: string;
  nome: string;
  nascimento: string;
  sexo: string;
  ingresso: string;
  status: string;
  observacoesMedicas: string | null;
  parentesco: string;
  responsavelPrincipal: boolean;
  casa: CasaDoResidente | null;
  registros7d: number;
  totalRegistros: number;
  registros: RegistroTimeline[];
};

type LinhaVinculoFamiliar = {
  id_residente: string;
  parentesco: string;
  responsavel_principal: boolean;
};

type LinhaResidente = {
  id_residente: string;
  id_ilpi: string;
  nome: string;
  data_nascimento: string;
  sexo: string;
  observacoes_medicas: string | null;
  data_ingresso: string;
  status: string;
};

type LinhaCasa = {
  id_ilpi: string;
  slug: string;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  endereco: string;
  telefone: string;
  email: string;
  publicado: boolean;
};

type LinhaTimeline = {
  id_registro: string;
  id_residente: string;
  tipo: string;
  titulo: string;
  descricao: string;
  criado_em_dispositivo: string;
  sincronizado_em_servidor: string;
  sincronizacao_atrasada: boolean;
  autor_nome: string | null;
  autor_cargo: string | null;
};

type LinhaAdesao = {
  id_adesao: string;
  id_ilpi: string;
  status: string;
  data_solicitacao: string;
  data_resposta: string | null;
};

function mapearRegistro(
  linha: LinhaTimeline,
  nomeResidente: string,
): RegistroTimeline {
  return {
    id: linha.id_registro,
    residenteId: linha.id_residente,
    residenteNome: nomeResidente,
    tipo: linha.tipo,
    titulo: linha.titulo,
    descricao: linha.descricao,
    criadoEm: linha.criado_em_dispositivo,
    sincronizadoEm: linha.sincronizado_em_servidor,
    atrasado: Boolean(linha.sincronizacao_atrasada),
    autorNome: linha.autor_nome ?? "Equipe da casa",
    autorCargo: linha.autor_cargo ?? "",
  };
}

export const usuarioDoPortal = cache(async (): Promise<UsuarioDoPortal | null> => {
  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return null;

  const { data } = await supabase
    .from("usuario")
    .select("nome, email, avatar_url")
    .eq("id_usuario", user.id)
    .maybeSingle();

  return {
    nome: (data?.nome as string | undefined) ?? user.email ?? "Familiar",
    email: (data?.email as string | undefined) ?? user.email ?? "",
    avatarUrl: (data?.avatar_url as string | null | undefined) ?? null,
  };
});

export async function portalDoFamiliar(): Promise<PortalDoFamiliar> {
  const vazio: PortalDoFamiliar = {
    residentes: [],
    resumo: {
      residentes: 0,
      residentesAtivos: 0,
      registros7d: 0,
      ultimaAtualizacao: null,
      adesoesPendentes: 0,
    },
    atividade: [],
    adesoes: [],
  };

  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return vazio;

  // Filtra explicitamente por id_usuario para que gestores/funcionários que
  // também acessem o portal vejam apenas seus vínculos familiares reais.
  const [vinculosRes, adesoesRes] = await Promise.all([
    supabase
      .from("familiar_residente")
      .select("id_residente, parentesco, responsavel_principal")
      .eq("id_usuario", user.id),
    supabase
      .from("adesao_ilpi")
      .select("id_adesao, id_ilpi, status, data_solicitacao, data_resposta")
      .eq("id_usuario", user.id)
      .order("data_solicitacao", { ascending: false })
      .limit(12),
  ]);

  const vinculos = (vinculosRes.data ?? []) as unknown as LinhaVinculoFamiliar[];
  const adesoesLinhas = (adesoesRes.data ?? []) as unknown as LinhaAdesao[];
  const idsResidentes = [...new Set(vinculos.map((v) => v.id_residente))];

  const desde7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let residentesLinhas: LinhaResidente[] = [];
  let timeline7dIds: { id_residente: string }[] = [];
  let totalRegistros7d = 0;
  let timelineRecentes: LinhaTimeline[] = [];

  if (idsResidentes.length > 0) {
    const [resRes, reg7dRes, recentesRes] = await Promise.all([
      supabase
        .from("residente")
        .select(
          "id_residente, id_ilpi, nome, data_nascimento, sexo, observacoes_medicas, data_ingresso, status",
        )
        .in("id_residente", idsResidentes)
        .order("nome", { ascending: true }),
      supabase
        .from("registro_timeline")
        .select("id_residente", { count: "exact" })
        .in("id_residente", idsResidentes)
        .gte("criado_em_dispositivo", desde7d),
      supabase
        .from("registro_timeline")
        .select(
          "id_registro, id_residente, tipo, titulo, descricao, criado_em_dispositivo, sincronizado_em_servidor, sincronizacao_atrasada, autor_nome, autor_cargo",
        )
        .in("id_residente", idsResidentes)
        .order("criado_em_dispositivo", { ascending: false })
        .limit(24),
    ]);

    residentesLinhas = (resRes.data ?? []) as unknown as LinhaResidente[];
    timeline7dIds = (reg7dRes.data ?? []) as unknown as { id_residente: string }[];
    totalRegistros7d = reg7dRes.count ?? timeline7dIds.length;
    timelineRecentes = (recentesRes.data ?? []) as unknown as LinhaTimeline[];
  }

  const idsCasas = [
    ...new Set([
      ...residentesLinhas.map((r) => r.id_ilpi),
      ...adesoesLinhas.map((a) => a.id_ilpi),
    ]),
  ];

  const casaPorId = new Map<string, CasaDoResidente>();
  if (idsCasas.length > 0) {
    const [casasRes, fotosRes] = await Promise.all([
      supabase
        .from("ilpi")
        .select("id_ilpi, slug, nome, bairro, cidade, uf, endereco, telefone, email, publicado")
        .in("id_ilpi", idsCasas),
      supabase
        .from("foto_ilpi")
        .select("id_ilpi, url, ordem")
        .in("id_ilpi", idsCasas)
        .order("ordem", { ascending: true }),
    ]);

    const capaPorCasa = new Map<string, string>();
    for (const foto of (fotosRes.data ?? []) as unknown as { id_ilpi: string; url: string }[]) {
      if (!capaPorCasa.has(foto.id_ilpi)) capaPorCasa.set(foto.id_ilpi, foto.url);
    }

    for (const casa of (casasRes.data ?? []) as unknown as LinhaCasa[]) {
      casaPorId.set(casa.id_ilpi, {
        id: casa.id_ilpi,
        slug: casa.slug,
        nome: casa.nome,
        bairro: casa.bairro,
        cidade: casa.cidade,
        uf: casa.uf,
        endereco: casa.endereco,
        telefone: casa.telefone,
        email: casa.email,
        publicado: Boolean(casa.publicado),
        capaUrl: capaPorCasa.get(casa.id_ilpi) ?? null,
      });
    }
  }

  const vinculoPorResidente = new Map(vinculos.map((v) => [v.id_residente, v]));
  const nomePorResidente = new Map(residentesLinhas.map((r) => [r.id_residente, r.nome]));

  const contagem7dPorResidente = new Map<string, number>();
  for (const item of timeline7dIds) {
    contagem7dPorResidente.set(
      item.id_residente,
      (contagem7dPorResidente.get(item.id_residente) ?? 0) + 1,
    );
  }

  const ultimoPorResidente = new Map<string, LinhaTimeline>();
  for (const item of timelineRecentes) {
    if (!ultimoPorResidente.has(item.id_residente)) {
      ultimoPorResidente.set(item.id_residente, item);
    }
  }

  const residentes: ResidenteVinculado[] = residentesLinhas.map((r) => {
    const vinculo = vinculoPorResidente.get(r.id_residente);
    const ultimo = ultimoPorResidente.get(r.id_residente);
    return {
      id: r.id_residente,
      nome: r.nome,
      nascimento: r.data_nascimento,
      sexo: r.sexo,
      ingresso: r.data_ingresso,
      status: r.status,
      observacoesMedicas: r.observacoes_medicas,
      parentesco: vinculo?.parentesco ?? "Familiar",
      responsavelPrincipal: Boolean(vinculo?.responsavel_principal),
      casa: casaPorId.get(r.id_ilpi) ?? null,
      registros7d: contagem7dPorResidente.get(r.id_residente) ?? 0,
      ultimoRegistro: ultimo
        ? {
            tipo: ultimo.tipo,
            titulo: ultimo.titulo,
            quando: ultimo.criado_em_dispositivo,
            autorNome: ultimo.autor_nome ?? "Equipe da casa",
          }
        : null,
    };
  });

  const atividade = timelineRecentes
    .slice(0, 8)
    .map((item) => mapearRegistro(item, nomePorResidente.get(item.id_residente) ?? "Residente"));

  const adesoes: AdesaoDoFamiliar[] = adesoesLinhas.map((a) => {
    const casa = casaPorId.get(a.id_ilpi);
    return {
      id: a.id_adesao,
      casaId: a.id_ilpi,
      casaNome: casa?.nome ?? "Instituição",
      casaSlug: casa?.slug ?? null,
      casaBairro: casa?.bairro ?? null,
      casaCidade: casa?.cidade ?? null,
      casaUf: casa?.uf ?? null,
      casaCapaUrl: casa?.capaUrl ?? null,
      casaPublicada: Boolean(casa?.publicado),
      status: a.status,
      quando: a.data_solicitacao,
      respondidaEm: a.data_resposta,
    };
  });

  return {
    residentes,
    resumo: {
      residentes: residentes.length,
      residentesAtivos: residentes.filter((r) => r.status === "ATIVO").length,
      registros7d: totalRegistros7d,
      ultimaAtualizacao: atividade[0]?.criadoEm ?? null,
      adesoesPendentes: adesoes.filter((a) => a.status === "PENDENTE").length,
    },
    atividade,
    adesoes,
  };
}

type LinhaIlpiPublica = {
  id_ilpi: string;
  slug: string;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  vagas: number | string | null;
  capa_url: string | null;
};

/** Solicitações de entrada (adesao_ilpi) do familiar e catálogo publicado para novos pedidos. */
export async function solicitacoesDoFamiliar(): Promise<SolicitacoesDoFamiliar> {
  const vazio: SolicitacoesDoFamiliar = {
    adesoes: [],
    casasDisponiveis: [],
    casasVinculadasIds: [],
    resumo: { total: 0, pendentes: 0, aprovadas: 0, recusadas: 0, canceladas: 0 },
  };

  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return vazio;

  // Filtra adesao_ilpi e familiar_residente por id_usuario para que gestores
  // que abram o portal vejam apenas seus próprios pedidos como familiar.
  const [adesoesRes, publicasRes, vinculosRes] = await Promise.all([
    supabase
      .from("adesao_ilpi")
      .select("id_adesao, id_ilpi, status, data_solicitacao, data_resposta")
      .eq("id_usuario", user.id)
      .order("data_solicitacao", { ascending: false })
      .limit(100),
    supabase
      .from("ilpi_publica")
      .select("id_ilpi, slug, nome, bairro, cidade, uf, vagas, capa_url")
      .order("nome", { ascending: true }),
    supabase
      .from("familiar_residente")
      .select("id_residente")
      .eq("id_usuario", user.id),
  ]);

  const adesoesLinhas = (adesoesRes.data ?? []) as unknown as LinhaAdesao[];
  const publicasLinhas = (publicasRes.data ?? []) as unknown as LinhaIlpiPublica[];
  const idsResidentes = [
    ...new Set(
      ((vinculosRes.data ?? []) as unknown as { id_residente: string }[]).map(
        (v) => v.id_residente,
      ),
    ),
  ];

  const casasDisponiveis: CasaDisponivel[] = publicasLinhas.map((c) => {
    const vagas = typeof c.vagas === "number" ? c.vagas : Number(c.vagas ?? 0);
    return {
      id: c.id_ilpi,
      slug: c.slug,
      nome: c.nome,
      bairro: c.bairro,
      cidade: c.cidade,
      uf: c.uf,
      vagas: Number.isFinite(vagas) ? vagas : 0,
      capaUrl: c.capa_url ?? null,
    };
  });

  const casaInfoPorId = new Map<
    string,
    {
      nome: string;
      slug: string | null;
      bairro: string | null;
      cidade: string | null;
      uf: string | null;
      capaUrl: string | null;
      publicado: boolean;
    }
  >();

  for (const casa of casasDisponiveis) {
    casaInfoPorId.set(casa.id, {
      nome: casa.nome,
      slug: casa.slug,
      bairro: casa.bairro,
      cidade: casa.cidade,
      uf: casa.uf,
      capaUrl: casa.capaUrl,
      publicado: true,
    });
  }

  // Casas do histórico que não estão publicadas agora (rascunho/retirada):
  // consulta ilpi/foto_ilpi sob RLS (só retorna se o usuário puder ler).
  const idsFaltando = [
    ...new Set(adesoesLinhas.map((a) => a.id_ilpi).filter((id) => !casaInfoPorId.has(id))),
  ];

  const [extrasCasasRes, extrasFotosRes, residentesCasasRes] = await Promise.all([
    idsFaltando.length > 0
      ? supabase
          .from("ilpi")
          .select("id_ilpi, slug, nome, bairro, cidade, uf, publicado")
          .in("id_ilpi", idsFaltando)
      : Promise.resolve({ data: null }),
    idsFaltando.length > 0
      ? supabase
          .from("foto_ilpi")
          .select("id_ilpi, url, ordem")
          .in("id_ilpi", idsFaltando)
          .order("ordem", { ascending: true })
      : Promise.resolve({ data: null }),
    idsResidentes.length > 0
      ? supabase.from("residente").select("id_ilpi").in("id_residente", idsResidentes)
      : Promise.resolve({ data: null }),
  ]);

  const capaExtra = new Map<string, string>();
  for (const foto of (extrasFotosRes.data ?? []) as unknown as {
    id_ilpi: string;
    url: string;
  }[]) {
    if (!capaExtra.has(foto.id_ilpi)) capaExtra.set(foto.id_ilpi, foto.url);
  }

  for (const casa of (extrasCasasRes.data ?? []) as unknown as {
    id_ilpi: string;
    slug: string;
    nome: string;
    bairro: string;
    cidade: string;
    uf: string;
    publicado: boolean;
  }[]) {
    casaInfoPorId.set(casa.id_ilpi, {
      nome: casa.nome,
      slug: casa.slug,
      bairro: casa.bairro,
      cidade: casa.cidade,
      uf: casa.uf,
      capaUrl: capaExtra.get(casa.id_ilpi) ?? null,
      publicado: Boolean(casa.publicado),
    });
  }

  const casasVinculadasIds = [
    ...new Set(
      ((residentesCasasRes.data ?? []) as unknown as { id_ilpi: string }[]).map(
        (r) => r.id_ilpi,
      ),
    ),
  ];

  const adesoes: AdesaoDoFamiliar[] = adesoesLinhas.map((a) => {
    const casa = casaInfoPorId.get(a.id_ilpi);
    return {
      id: a.id_adesao,
      casaId: a.id_ilpi,
      casaNome: casa?.nome ?? "Instituição",
      casaSlug: casa?.slug ?? null,
      casaBairro: casa?.bairro ?? null,
      casaCidade: casa?.cidade ?? null,
      casaUf: casa?.uf ?? null,
      casaCapaUrl: casa?.capaUrl ?? null,
      casaPublicada: Boolean(casa?.publicado),
      status: a.status,
      quando: a.data_solicitacao,
      respondidaEm: a.data_resposta,
    };
  });

  return {
    adesoes,
    casasDisponiveis,
    casasVinculadasIds,
    resumo: {
      total: adesoes.length,
      pendentes: adesoes.filter((a) => a.status === "PENDENTE").length,
      aprovadas: adesoes.filter((a) => a.status === "APROVADA").length,
      recusadas: adesoes.filter((a) => a.status === "RECUSADA").length,
      canceladas: adesoes.filter((a) => a.status === "CANCELADA").length,
    },
  };
}

/** Detalhes e linha do tempo de um residente vinculado ao familiar logado (memoizado por request). */
export const residenteDoFamiliar = cache(async (id: string): Promise<ResidenteDetalhe | null> => {
  if (!UUID_RE.test(id)) return null;

  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return null;

  const { data: vinculoDado } = await supabase
    .from("familiar_residente")
    .select("id_residente, parentesco, responsavel_principal")
    .eq("id_usuario", user.id)
    .eq("id_residente", id)
    .maybeSingle();

  if (!vinculoDado) return null;
  const vinculo = vinculoDado as unknown as LinhaVinculoFamiliar;

  const desde7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [residenteRes, registrosRes, totalRes, reg7dRes] = await Promise.all([
    supabase
      .from("residente")
      .select(
        "id_residente, id_ilpi, nome, data_nascimento, sexo, observacoes_medicas, data_ingresso, status",
      )
      .eq("id_residente", id)
      .maybeSingle(),
    supabase
      .from("registro_timeline")
      .select(
        "id_registro, id_residente, tipo, titulo, descricao, criado_em_dispositivo, sincronizado_em_servidor, sincronizacao_atrasada, autor_nome, autor_cargo",
      )
      .eq("id_residente", id)
      .order("criado_em_dispositivo", { ascending: false })
      .limit(100),
    supabase
      .from("registro_timeline")
      .select("id_registro", { count: "exact", head: true })
      .eq("id_residente", id),
    supabase
      .from("registro_timeline")
      .select("id_registro", { count: "exact", head: true })
      .eq("id_residente", id)
      .gte("criado_em_dispositivo", desde7d),
  ]);

  if (!residenteRes.data) return null;
  const r = residenteRes.data as unknown as LinhaResidente;

  const [casaRes, fotoRes] = await Promise.all([
    supabase
      .from("ilpi")
      .select("id_ilpi, slug, nome, bairro, cidade, uf, endereco, telefone, email, publicado")
      .eq("id_ilpi", r.id_ilpi)
      .maybeSingle(),
    supabase
      .from("foto_ilpi")
      .select("url")
      .eq("id_ilpi", r.id_ilpi)
      .order("ordem", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const casaLinha = casaRes.data as unknown as LinhaCasa | null;
  const fotoLinha = fotoRes.data as unknown as { url: string } | null;

  const casa: CasaDoResidente | null = casaLinha
    ? {
        id: casaLinha.id_ilpi,
        slug: casaLinha.slug,
        nome: casaLinha.nome,
        bairro: casaLinha.bairro,
        cidade: casaLinha.cidade,
        uf: casaLinha.uf,
        endereco: casaLinha.endereco,
        telefone: casaLinha.telefone,
        email: casaLinha.email,
        publicado: Boolean(casaLinha.publicado),
        capaUrl: fotoLinha?.url ?? null,
      }
    : null;

  const linhasRegistros = (registrosRes.data ?? []) as unknown as LinhaTimeline[];

  return {
    id: r.id_residente,
    nome: r.nome,
    nascimento: r.data_nascimento,
    sexo: r.sexo,
    ingresso: r.data_ingresso,
    status: r.status,
    observacoesMedicas: r.observacoes_medicas,
    parentesco: vinculo.parentesco,
    responsavelPrincipal: Boolean(vinculo.responsavel_principal),
    casa,
    registros7d: reg7dRes.count ?? 0,
    totalRegistros: totalRes.count ?? linhasRegistros.length,
    registros: linhasRegistros.map((item) => mapearRegistro(item, r.nome)),
  };
});

// ---- Financeiro (informativo) ----------------------------------------------

export type FaturaFamiliar = {
  id: string;
  assinaturaId: string;
  valor: number;
  vencimento: string;
  pagamento: string | null;
  status: string;
};

export type AssinaturaFamiliar = {
  id: string;
  status: string;
  inicio: string;
  fim: string | null;
  planoNome: string;
  planoValor: number;
  planoDescricao: string | null;
  casaId: string;
  casaNome: string;
  casaCidade: string;
  casaUf: string;
  casaTelefone: string;
  casaEmail: string;
  faturas: FaturaFamiliar[];
};

export type FinanceiroDoFamiliar = {
  assinaturas: AssinaturaFamiliar[];
  resumo: {
    assinaturasAtivas: number;
    mensalidadeAtiva: number;
    faturasEmAberto: number;
    valorEmAberto: number;
    faturasPagas: number;
  };
};

export async function financeiroDoFamiliar(): Promise<FinanceiroDoFamiliar> {
  const vazio: FinanceiroDoFamiliar = {
    assinaturas: [],
    resumo: {
      assinaturasAtivas: 0,
      mensalidadeAtiva: 0,
      faturasEmAberto: 0,
      valorEmAberto: 0,
      faturasPagas: 0,
    },
  };

  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return vazio;

  const { data: assData } = await supabase
    .from("assinatura")
    .select(
      "id_assinatura, id_plano, status, data_inicio, data_fim, plano(nome, valor, descricao, id_ilpi, ilpi(nome, cidade, uf, telefone, email))",
    )
    .eq("id_usuario", user.id)
    .order("data_inicio", { ascending: false });

  type LinhaAss = {
    id_assinatura: string;
    id_plano: string;
    status: string;
    data_inicio: string;
    data_fim: string | null;
    plano: {
      nome: string;
      valor: number | string;
      descricao: string | null;
      id_ilpi: string;
      ilpi: {
        nome: string;
        cidade: string;
        uf: string;
        telefone: string;
        email: string;
      } | null;
    } | null;
  };

  const linhas = (assData ?? []) as unknown as LinhaAss[];
  if (linhas.length === 0) return vazio;

  const idsAss = linhas.map((a) => a.id_assinatura);
  const { data: fatData } = await supabase
    .from("faturamento")
    .select("id_faturamento, id_assinatura, valor, data_vencimento, data_pagamento, status_pagamento")
    .in("id_assinatura", idsAss)
    .order("data_vencimento", { ascending: false });

  const faturasPorAss = new Map<string, FaturaFamiliar[]>();
  let faturasEmAberto = 0;
  let valorEmAberto = 0;
  let faturasPagas = 0;

  for (const f of (fatData ?? []) as unknown as {
    id_faturamento: string;
    id_assinatura: string;
    valor: number | string;
    data_vencimento: string;
    data_pagamento: string | null;
    status_pagamento: string;
  }[]) {
    const val = Number(f.valor);
    const item: FaturaFamiliar = {
      id: f.id_faturamento,
      assinaturaId: f.id_assinatura,
      valor: Number.isFinite(val) ? val : 0,
      vencimento: f.data_vencimento,
      pagamento: f.data_pagamento,
      status: f.status_pagamento,
    };
    const lista = faturasPorAss.get(f.id_assinatura) ?? [];
    lista.push(item);
    faturasPorAss.set(f.id_assinatura, lista);

    if (f.status_pagamento === "PENDENTE" || f.status_pagamento === "ATRASADO") {
      faturasEmAberto += 1;
      valorEmAberto += item.valor;
    } else if (f.status_pagamento === "PAGO") {
      faturasPagas += 1;
    }
  }

  let assinaturasAtivas = 0;
  let mensalidadeAtiva = 0;

  const assinaturas: AssinaturaFamiliar[] = linhas.map((a) => {
    const valPlano = Number(a.plano?.valor ?? 0);
    const valorNum = Number.isFinite(valPlano) ? valPlano : 0;
    if (a.status === "ATIVA") {
      assinaturasAtivas += 1;
      mensalidadeAtiva += valorNum;
    }
    return {
      id: a.id_assinatura,
      status: a.status,
      inicio: a.data_inicio,
      fim: a.data_fim,
      planoNome: a.plano?.nome ?? "Plano vinculado",
      planoValor: valorNum,
      planoDescricao: a.plano?.descricao ?? null,
      casaId: a.plano?.id_ilpi ?? "",
      casaNome: a.plano?.ilpi?.nome ?? "Instituição vinculada",
      casaCidade: a.plano?.ilpi?.cidade ?? "",
      casaUf: a.plano?.ilpi?.uf ?? "",
      casaTelefone: a.plano?.ilpi?.telefone ?? "",
      casaEmail: a.plano?.ilpi?.email ?? "",
      faturas: faturasPorAss.get(a.id_assinatura) ?? [],
    };
  });

  return {
    assinaturas,
    resumo: {
      assinaturasAtivas,
      mensalidadeAtiva,
      faturasEmAberto,
      valorEmAberto,
      faturasPagas,
    },
  };
}

// ---- Avaliações do familiar ------------------------------------------------

export type CasaParaAvaliar = {
  casaId: string;
  slug: string;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  publicado: boolean;
  capaUrl: string | null;
  residentesNomes: string[];
  avaliacao: {
    id: string;
    nota: number;
    comentario: string;
    data: string;
  } | null;
};

export async function avaliacoesDoFamiliar(): Promise<CasaParaAvaliar[]> {
  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return [];

  const [vinculosRes, minhasAvRes] = await Promise.all([
    supabase
      .from("familiar_residente")
      .select("id_residente")
      .eq("id_usuario", user.id),
    supabase
      .from("avaliacao")
      .select("id_avaliacao, id_ilpi, nota, comentario, data_avaliacao")
      .eq("id_usuario", user.id),
  ]);

  const idsRes = ((vinculosRes.data ?? []) as unknown as { id_residente: string }[]).map(
    (v) => v.id_residente,
  );
  if (idsRes.length === 0) return [];

  const { data: resData } = await supabase
    .from("residente")
    .select("id_residente, id_ilpi, nome")
    .in("id_residente", idsRes);

  const residentes = (resData ?? []) as unknown as {
    id_residente: string;
    id_ilpi: string;
    nome: string;
  }[];
  if (residentes.length === 0) return [];

  const nomesPorCasa = new Map<string, string[]>();
  for (const r of residentes) {
    const lista = nomesPorCasa.get(r.id_ilpi) ?? [];
    lista.push(r.nome);
    nomesPorCasa.set(r.id_ilpi, lista);
  }
  const idsCasas = [...nomesPorCasa.keys()];

  const [casasRes, fotosRes] = await Promise.all([
    supabase
      .from("ilpi")
      .select("id_ilpi, slug, nome, bairro, cidade, uf, publicado")
      .in("id_ilpi", idsCasas)
      .order("nome", { ascending: true }),
    supabase
      .from("foto_ilpi")
      .select("id_ilpi, url")
      .in("id_ilpi", idsCasas)
      .order("ordem", { ascending: true }),
  ]);

  const capaPorCasa = new Map<string, string>();
  for (const f of (fotosRes.data ?? []) as unknown as { id_ilpi: string; url: string }[]) {
    if (!capaPorCasa.has(f.id_ilpi)) capaPorCasa.set(f.id_ilpi, f.url);
  }

  const avPorCasa = new Map<
    string,
    { id: string; nota: number; comentario: string; data: string }
  >();
  for (const a of (minhasAvRes.data ?? []) as unknown as {
    id_avaliacao: string;
    id_ilpi: string;
    nota: number;
    comentario: string | null;
    data_avaliacao: string;
  }[]) {
    avPorCasa.set(a.id_ilpi, {
      id: a.id_avaliacao,
      nota: Number(a.nota),
      comentario: a.comentario ?? "",
      data: a.data_avaliacao,
    });
  }

  return ((casasRes.data ?? []) as unknown as {
    id_ilpi: string;
    slug: string;
    nome: string;
    bairro: string;
    cidade: string;
    uf: string;
    publicado: boolean;
  }[]).map((c) => ({
    casaId: c.id_ilpi,
    slug: c.slug,
    nome: c.nome,
    bairro: c.bairro,
    cidade: c.cidade,
    uf: c.uf,
    publicado: Boolean(c.publicado),
    capaUrl: capaPorCasa.get(c.id_ilpi) ?? null,
    residentesNomes: nomesPorCasa.get(c.id_ilpi) ?? [],
    avaliacao: avPorCasa.get(c.id_ilpi) ?? null,
  }));
}

// ---- Chat / Suporte do familiar --------------------------------------------

export type MensagemChat = {
  id: string;
  conversaId: string;
  conteudo: string;
  dataHora: string;
  ehMinha: boolean;
};

export type ConversaFamiliar = {
  id: string;
  casaId: string;
  casaNome: string;
  casaCidade: string;
  casaUf: string;
  criadaEm: string;
  mensagens: MensagemChat[];
};

export type CasaParaConversar = {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
};

export type ChatDoFamiliar = {
  usuarioId: string;
  conversas: ConversaFamiliar[];
  casasDisponiveis: CasaParaConversar[];
};

export async function chatDoFamiliar(): Promise<ChatDoFamiliar> {
  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return { usuarioId: "", conversas: [], casasDisponiveis: [] };

  const [convRes, vincRes, adesoesRes] = await Promise.all([
    supabase
      .from("conversa")
      .select("id_conversa, id_ilpi, data_criacao, ilpi(nome, cidade, uf)")
      .eq("id_usuario", user.id)
      .order("data_criacao", { ascending: false }),
    supabase
      .from("familiar_residente")
      .select("residente(id_ilpi)")
      .eq("id_usuario", user.id),
    supabase
      .from("adesao_ilpi")
      .select("id_ilpi")
      .eq("id_usuario", user.id)
      .in("status", ["PENDENTE", "APROVADA"]),
  ]);

  const linhasConv = (convRes.data ?? []) as unknown as {
    id_conversa: string;
    id_ilpi: string;
    data_criacao: string;
    ilpi: { nome: string; cidade: string; uf: string } | null;
  }[];

  const idsConv = linhasConv.map((c) => c.id_conversa);
  const mensagensPorConv = new Map<string, MensagemChat[]>();

  if (idsConv.length > 0) {
    const { data: msgData } = await supabase
      .from("mensagem")
      .select("id_mensagem, id_conversa, id_usuario, conteudo, data_hora")
      .in("id_conversa", idsConv)
      .order("data_hora", { ascending: true })
      .limit(500);

    for (const m of (msgData ?? []) as unknown as {
      id_mensagem: string;
      id_conversa: string;
      id_usuario: string;
      conteudo: string;
      data_hora: string;
    }[]) {
      const lista = mensagensPorConv.get(m.id_conversa) ?? [];
      lista.push({
        id: m.id_mensagem,
        conversaId: m.id_conversa,
        conteudo: m.conteudo,
        dataHora: m.data_hora,
        ehMinha: m.id_usuario === user.id,
      });
      mensagensPorConv.set(m.id_conversa, lista);
    }
  }

  const conversas: ConversaFamiliar[] = linhasConv
    .map((c) => ({
      id: c.id_conversa,
      casaId: c.id_ilpi,
      casaNome: c.ilpi?.nome ?? "Instituição",
      casaCidade: c.ilpi?.cidade ?? "",
      casaUf: c.ilpi?.uf ?? "",
      criadaEm: c.data_criacao,
      mensagens: mensagensPorConv.get(c.id_conversa) ?? [],
    }))
    .sort((a, b) => {
      const ultA = a.mensagens[a.mensagens.length - 1]?.dataHora ?? a.criadaEm;
      const ultB = b.mensagens[b.mensagens.length - 1]?.dataHora ?? b.criadaEm;
      return ultB.localeCompare(ultA);
    });

  // Casas com as quais o familiar já tem relação (residente ou adesão) e ainda sem conversa
  const idsJaComConversa = new Set(conversas.map((c) => c.casaId));
  const idsCandidatas = new Set<string>();
  for (const v of (vincRes.data ?? []) as unknown as { residente: { id_ilpi: string } | null }[]) {
    if (v.residente?.id_ilpi && !idsJaComConversa.has(v.residente.id_ilpi)) {
      idsCandidatas.add(v.residente.id_ilpi);
    }
  }
  for (const a of (adesoesRes.data ?? []) as unknown as { id_ilpi: string }[]) {
    if (a.id_ilpi && !idsJaComConversa.has(a.id_ilpi)) {
      idsCandidatas.add(a.id_ilpi);
    }
  }

  let casasDisponiveis: CasaParaConversar[] = [];
  if (idsCandidatas.size > 0) {
    const { data: casasData } = await supabase
      .from("ilpi")
      .select("id_ilpi, nome, cidade, uf")
      .in("id_ilpi", [...idsCandidatas])
      .order("nome", { ascending: true });

    casasDisponiveis = ((casasData ?? []) as unknown as {
      id_ilpi: string;
      nome: string;
      cidade: string;
      uf: string;
    }[]).map((c) => ({
      id: c.id_ilpi,
      nome: c.nome,
      cidade: c.cidade,
      uf: c.uf,
    }));
  }

  return { usuarioId: user.id, conversas, casasDisponiveis };
}
