import { createClient, createClientOpcional } from "@/lib/supabase/server";

/**
 * Camada de leitura do painel do gestor. Nenhuma dessas consultas usa service
 * key: quem decide o que volta é a RLS, a partir do vínculo do usuário logado.
 */

type Cliente = Awaited<ReturnType<typeof createClient>>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const numero = (valor: number | string | null | undefined, padrao = 0): number => {
  if (valor === null || valor === undefined) return padrao;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : padrao;
};

export type CasaDoGestor = {
  id: string;
  slug: string;
  nome: string;
  cidade: string;
  bairro: string;
  uf: string;
  vagas: number;
  publicado: boolean;
  destaque: string | null;
  tags: string[];
  capaUrl: string | null;
  residentes: number;
  equipe: number;
  solicitacoes: number;
  nota: number | null;
  avaliacoes: number;
};

export type ResumoGestor = {
  casas: number;
  residentes: number;
  equipe: number;
  solicitacoes: number;
  registros7d: number;
  notaMedia: number | null;
  avaliacoes: number;
};

export type SolicitacaoPendente = {
  id: string;
  casa: string;
  casaId: string;
  solicitante: string;
  quando: string;
};

export type RegistroRecente = {
  id: string;
  residente: string;
  tipo: string;
  titulo: string;
  quando: string;
  autor: string;
  atrasado: boolean;
};

export type PainelDoGestor = {
  casas: CasaDoGestor[];
  resumo: ResumoGestor;
  solicitacoesPendentes: SolicitacaoPendente[];
  atividade: RegistroRecente[];
};

export type CasaCompleta = CasaDoGestor & {
  cnpj: string;
  telefone: string;
  email: string;
  site: string | null;
  descricao: string;
  endereco: string;
  criadaEm: string;
  mensalidade: number | null;
  fotos: { id: string; url: string; legenda: string | null }[];
  planos: {
    id: string;
    nome: string;
    valor: number;
    descricao: string | null;
    ativo: boolean;
  }[];
  colaboradores: { id: string; nome: string; cargo: string; desde: string }[];
  residentesLista: {
    id: string;
    nome: string;
    nascimento: string;
    status: string;
    ingresso: string;
  }[];
  solicitacoesLista: { id: string; solicitante: string; status: string; quando: string }[];
  avaliacoesLista: {
    nota: number;
    comentario: string | null;
    autor: string;
    quando: string;
  }[];
};

type LinhaCasa = {
  id_ilpi: string;
  slug: string;
  nome: string;
  cidade: string;
  bairro: string;
  uf: string;
  vagas: number;
  publicado: boolean;
  destaque: string | null;
  tags: string[] | null;
};

export type UsuarioDoPainel = { nome: string; email: string };

export async function usuarioAtual(): Promise<UsuarioDoPainel | null> {
  const supabase = await createClientOpcional();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuario")
    .select("nome, email")
    .eq("id_usuario", user.id)
    .maybeSingle();

  return {
    nome: (data?.nome as string | undefined) ?? user.email ?? "Gestor",
    email: (data?.email as string | undefined) ?? user.email ?? "",
  };
}

/** Ids das casas em que o usuário logado tem vínculo de GESTOR ativo. */
async function idsDasMinhasCasas(supabase: Cliente): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("vinculo_ilpi")
    .select("id_ilpi")
    .eq("id_usuario", user.id)
    .eq("cargo", "GESTOR")
    .eq("ativo", true);

  return [...new Set((data ?? []).map((linha) => linha.id_ilpi as string))];
}

export async function painelDoGestor(): Promise<PainelDoGestor> {
  const vazio: PainelDoGestor = {
    casas: [],
    resumo: {
      casas: 0,
      residentes: 0,
      equipe: 0,
      solicitacoes: 0,
      registros7d: 0,
      notaMedia: null,
      avaliacoes: 0,
    },
    solicitacoesPendentes: [],
    atividade: [],
  };

  const supabase = await createClientOpcional();
  if (!supabase) return vazio;

  const ids = await idsDasMinhasCasas(supabase);
  if (ids.length === 0) return vazio;

  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [casas, fotos, residentes, vinculos, adesoes, avaliacoes] =
    await Promise.all([
      supabase
        .from("ilpi")
        .select("id_ilpi, slug, nome, cidade, bairro, uf, vagas, publicado, destaque, tags")
        .in("id_ilpi", ids)
        .order("nome", { ascending: true }),
      supabase
        .from("foto_ilpi")
        .select("id_ilpi, url, ordem")
        .in("id_ilpi", ids)
        .order("ordem", { ascending: true }),
      supabase
        .from("residente")
        .select("id_residente, id_ilpi, nome, status")
        .in("id_ilpi", ids),
      supabase
        .from("vinculo_ilpi")
        .select("id_ilpi")
        .in("id_ilpi", ids)
        .eq("ativo", true),
      supabase
        .from("adesao_ilpi")
        .select("id_adesao, id_ilpi, status, data_solicitacao, usuario(nome)")
        .in("id_ilpi", ids)
        .eq("status", "PENDENTE")
        .order("data_solicitacao", { ascending: false }),
      supabase.from("avaliacao").select("id_ilpi, nota").in("id_ilpi", ids),
    ]);

  const listaCasas = (casas.data ?? []) as unknown as LinhaCasa[];
  if (listaCasas.length === 0) return vazio;

  const listaResidentes = (residentes.data ?? []) as unknown as {
    id_residente: string;
    id_ilpi: string;
    nome: string;
    status: string;
  }[];

  // Registro assistencial aponta para o residente (a casa não tem FK direta),
  // então a janela de sete dias sai do cruzamento residente -> casa, e o nome de
  // quem registrou vem pelo vínculo. A contagem é feita à parte, com `count`,
  // porque a lista do feed é limitada.
  const idsResidentes = listaResidentes.map((r) => r.id_residente);

  type LinhaRegistro = {
    id_registro: string;
    id_residente: string;
    tipo: string;
    titulo: string;
    criado_em_dispositivo: string;
    sincronizado_em_servidor: string;
    vinculo_ilpi: { usuario: { nome: string } | null } | null;
  };

  let totalRegistros = 0;
  let linhaRegistros: LinhaRegistro[] = [];

  if (idsResidentes.length > 0) {
    const [contagem, ultimos] = await Promise.all([
      supabase
        .from("registro_assistencial")
        .select("id_registro", { count: "exact", head: true })
        .in("id_residente", idsResidentes)
        .gte("criado_em_dispositivo", desde),
      supabase
        .from("registro_assistencial")
        .select(
          "id_registro, id_residente, tipo, titulo, criado_em_dispositivo, sincronizado_em_servidor, vinculo_ilpi(usuario(nome))",
        )
        .in("id_residente", idsResidentes)
        .gte("criado_em_dispositivo", desde)
        .order("criado_em_dispositivo", { ascending: false })
        .limit(8),
    ]);

    totalRegistros = contagem.count ?? 0;
    linhaRegistros = (ultimos.data ?? []) as unknown as LinhaRegistro[];
  }

  const nomeDoResidente = new Map(
    listaResidentes.map((r) => [r.id_residente, r.nome]),
  );

  const capaPorCasa = new Map<string, string>();
  for (const foto of (fotos.data ?? []) as unknown as {
    id_ilpi: string;
    url: string;
  }[]) {
    if (!capaPorCasa.has(foto.id_ilpi)) capaPorCasa.set(foto.id_ilpi, foto.url);
  }

  const linhas = listaCasas.map((casa) => {
    const id = casa.id_ilpi;
    const notas = ((avaliacoes.data ?? []) as unknown as {
      id_ilpi: string;
      nota: number | string;
    }[])
      .filter((a) => a.id_ilpi === id)
      .map((a) => numero(a.nota));

    return {
      id,
      slug: casa.slug,
      nome: casa.nome,
      cidade: casa.cidade,
      bairro: casa.bairro,
      uf: casa.uf,
      vagas: numero(casa.vagas),
      publicado: Boolean(casa.publicado),
      destaque: casa.destaque,
      tags: casa.tags ?? [],
      capaUrl: capaPorCasa.get(id) ?? null,
      residentes: listaResidentes.filter(
        (r) => r.id_ilpi === id && r.status === "ATIVO",
      ).length,
      equipe: ((vinculos.data ?? []) as unknown as { id_ilpi: string }[]).filter(
        (v) => v.id_ilpi === id,
      ).length,
      solicitacoes: ((adesoes.data ?? []) as unknown as { id_ilpi: string }[]).filter(
        (a) => a.id_ilpi === id,
      ).length,
      nota:
        notas.length > 0
          ? Math.round((notas.reduce((soma, n) => soma + n, 0) / notas.length) * 10) / 10
          : null,
      avaliacoes: notas.length,
    } satisfies CasaDoGestor;
  });

  const todasAsNotas = ((avaliacoes.data ?? []) as unknown as {
    nota: number | string;
  }[]).map((a) => numero(a.nota));

  const nomePorCasa = new Map(linhas.map((c) => [c.id, c.nome]));

  return {
    casas: linhas,
    resumo: {
      casas: linhas.length,
      residentes: linhas.reduce((soma, c) => soma + c.residentes, 0),
      equipe: linhas.reduce((soma, c) => soma + c.equipe, 0),
      solicitacoes: linhas.reduce((soma, c) => soma + c.solicitacoes, 0),
      registros7d: totalRegistros,
      notaMedia:
        todasAsNotas.length > 0
          ? Math.round(
              (todasAsNotas.reduce((soma, n) => soma + n, 0) / todasAsNotas.length) * 10,
            ) / 10
          : null,
      avaliacoes: todasAsNotas.length,
    },
    solicitacoesPendentes: ((adesoes.data ?? []) as unknown as {
      id_adesao: string;
      id_ilpi: string;
      data_solicitacao: string;
      usuario: { nome: string } | null;
    }[]).map((a) => ({
      id: a.id_adesao,
      casaId: a.id_ilpi,
      casa: nomePorCasa.get(a.id_ilpi) ?? "Casa",
      solicitante: a.usuario?.nome ?? "Familiar",
      quando: a.data_solicitacao,
    })),
    atividade: linhaRegistros.map((r) => ({
      id: r.id_registro,
      residente: nomeDoResidente.get(r.id_residente) ?? "Residente",
      tipo: r.tipo,
      titulo: r.titulo,
      quando: r.criado_em_dispositivo,
      autor: r.vinculo_ilpi?.usuario?.nome ?? "",
      atrasado:
        new Date(r.sincronizado_em_servidor).getTime() -
          new Date(r.criado_em_dispositivo).getTime() >
        10 * 60 * 1000,
    })),
  };
}

/** Casa completa, só se o usuário logado for gestor dela. null = não existe ou não é dele. */
export async function casaDoGestor(id: string): Promise<CasaCompleta | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClientOpcional();
  if (!supabase) return null;

  const ids = await idsDasMinhasCasas(supabase);
  if (!ids.includes(id)) return null;

  const { data: casa } = await supabase
    .from("ilpi")
    .select(
      "id_ilpi, slug, nome, cidade, bairro, uf, vagas, publicado, destaque, tags, cnpj, telefone, email, site, descricao, endereco, data_cadastro",
    )
    .eq("id_ilpi", id)
    .maybeSingle();

  if (!casa) return null;

  const [fotos, planos, residentes, vinculos, adesoes, avaliacoes] =
    await Promise.all([
      supabase
        .from("foto_ilpi")
        .select("id_foto, url, legenda")
        .eq("id_ilpi", id)
        .order("ordem", { ascending: true }),
      supabase
        .from("plano")
        .select("id_plano, nome, valor, descricao, ativo")
        .eq("id_ilpi", id)
        .order("valor", { ascending: true }),
      supabase
        .from("residente")
        .select("id_residente, nome, data_nascimento, status, data_ingresso")
        .eq("id_ilpi", id)
        .order("nome", { ascending: true }),
      supabase
        .from("vinculo_ilpi")
        .select("id_vinculo, cargo, data_vinculo, usuario(nome)")
        .eq("id_ilpi", id)
        .eq("ativo", true)
        .order("cargo", { ascending: true }),
      supabase
        .from("adesao_ilpi")
        .select("id_adesao, status, data_solicitacao, usuario(nome)")
        .eq("id_ilpi", id)
        .order("data_solicitacao", { ascending: false })
        .limit(20),
      supabase
        .from("avaliacao_publica")
        .select("nota, comentario, autor, data_avaliacao")
        .eq("id_ilpi", id)
        .order("data_avaliacao", { ascending: false })
        .limit(20),
    ]);

  const linha = casa as unknown as LinhaCasa & {
    cnpj: string;
    telefone: string;
    email: string;
    site: string | null;
    descricao: string | null;
    endereco: string;
    data_cadastro: string;
  };

  const notas = ((avaliacoes.data ?? []) as unknown as {
    nota: number | string;
  }[]).map((a) => numero(a.nota));

  const residentesLista = ((residentes.data ?? []) as unknown as {
    id_residente: string;
    nome: string;
    data_nascimento: string;
    status: string;
    data_ingresso: string;
  }[]).map((r) => ({
    id: r.id_residente,
    nome: r.nome,
    nascimento: r.data_nascimento,
    status: r.status,
    ingresso: r.data_ingresso,
  }));

  return {
    id: linha.id_ilpi,
    slug: linha.slug,
    nome: linha.nome,
    cidade: linha.cidade,
    bairro: linha.bairro,
    uf: linha.uf,
    vagas: numero(linha.vagas),
    publicado: Boolean(linha.publicado),
    destaque: linha.destaque,
    tags: linha.tags ?? [],
    capaUrl:
      ((fotos.data ?? []) as unknown as { url: string }[])[0]?.url ?? null,
    residentes: residentesLista.filter((r) => r.status === "ATIVO").length,
    equipe: (vinculos.data ?? []).length,
    solicitacoes: ((adesoes.data ?? []) as unknown as { status: string }[]).filter(
      (a) => a.status === "PENDENTE",
    ).length,
    nota:
      notas.length > 0
        ? Math.round((notas.reduce((soma, n) => soma + n, 0) / notas.length) * 10) / 10
        : null,
    avaliacoes: notas.length,
    cnpj: linha.cnpj,
    telefone: linha.telefone,
    email: linha.email,
    site: linha.site,
    descricao: linha.descricao ?? "",
    endereco: linha.endereco,
    criadaEm: linha.data_cadastro,
    mensalidade:
      ((planos.data ?? []) as unknown as { valor: number | string; ativo: boolean }[])
        .filter((p) => p.ativo)
        .map((p) => numero(p.valor))
        .sort((a, b) => a - b)[0] ?? null,
    fotos: ((fotos.data ?? []) as unknown as {
      id_foto: string;
      url: string;
      legenda: string | null;
    }[]).map((f) => ({ id: f.id_foto, url: f.url, legenda: f.legenda })),
    planos: ((planos.data ?? []) as unknown as {
      id_plano: string;
      nome: string;
      valor: number | string;
      descricao: string | null;
      ativo: boolean;
    }[]).map((p) => ({
      id: p.id_plano,
      nome: p.nome,
      valor: numero(p.valor),
      descricao: p.descricao,
      ativo: Boolean(p.ativo),
    })),
    colaboradores: ((vinculos.data ?? []) as unknown as {
      id_vinculo: string;
      cargo: string;
      data_vinculo: string;
      usuario: { nome: string } | null;
    }[]).map((v) => ({
      id: v.id_vinculo,
      nome: v.usuario?.nome ?? "Membro da equipe",
      cargo: v.cargo,
      desde: v.data_vinculo,
    })),
    residentesLista,
    solicitacoesLista: ((adesoes.data ?? []) as unknown as {
      id_adesao: string;
      status: string;
      data_solicitacao: string;
      usuario: { nome: string } | null;
    }[]).map((a) => ({
      id: a.id_adesao,
      solicitante: a.usuario?.nome ?? "Familiar",
      status: a.status,
      quando: a.data_solicitacao,
    })),
    avaliacoesLista: ((avaliacoes.data ?? []) as unknown as {
      nota: number | string;
      comentario: string | null;
      autor: string | null;
      data_avaliacao: string;
    }[]).map((a) => ({
      nota: numero(a.nota),
      comentario: a.comentario,
      autor: a.autor ?? "Familiar",
      quando: a.data_avaliacao,
    })),
  };
}

export type PlanoDoGestor = {
  id: string;
  casaId: string;
  casaNome: string;
  casaSlug: string;
  nome: string;
  valor: number;
  descricao: string | null;
  ativo: boolean;
};

export type PlanosDoGestor = {
  casas: { id: string; nome: string; slug: string; publicado: boolean }[];
  planos: PlanoDoGestor[];
};

export async function planosDoGestor(): Promise<PlanosDoGestor> {
  const supabase = await createClientOpcional();
  if (!supabase) return { casas: [], planos: [] };

  const ids = await idsDasMinhasCasas(supabase);
  if (ids.length === 0) return { casas: [], planos: [] };

  const [casasRes, planosRes] = await Promise.all([
    supabase
      .from("ilpi")
      .select("id_ilpi, nome, slug, publicado")
      .in("id_ilpi", ids)
      .order("nome", { ascending: true }),
    supabase
      .from("plano")
      .select("id_plano, id_ilpi, nome, valor, descricao, ativo")
      .in("id_ilpi", ids)
      .order("valor", { ascending: true })
      .order("nome", { ascending: true }),
  ]);

  const casas = ((casasRes.data ?? []) as unknown as {
    id_ilpi: string;
    nome: string;
    slug: string;
    publicado: boolean;
  }[]).map((c) => ({
    id: c.id_ilpi,
    nome: c.nome,
    slug: c.slug,
    publicado: Boolean(c.publicado),
  }));

  const casaPorId = new Map(casas.map((c) => [c.id, c]));

  const planos: PlanoDoGestor[] = ((planosRes.data ?? []) as unknown as {
    id_plano: string;
    id_ilpi: string;
    nome: string;
    valor: number | string;
    descricao: string | null;
    ativo: boolean;
  }[])
    .filter((p) => casaPorId.has(p.id_ilpi))
    .map((p) => {
      const casa = casaPorId.get(p.id_ilpi)!;
      return {
        id: p.id_plano,
        casaId: p.id_ilpi,
        casaNome: casa.nome,
        casaSlug: casa.slug,
        nome: p.nome,
        valor: numero(p.valor),
        descricao: p.descricao,
        ativo: Boolean(p.ativo),
      };
    });

  return { casas, planos };
}

export type FamiliarDoResidente = {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  telefone: string | null;
  parentesco: string;
  responsavelPrincipal: boolean;
};

export type ResidenteDoGestor = {
  id: string;
  casaId: string;
  casaNome: string;
  nome: string;
  cpf: string;
  nascimento: string;
  sexo: string;
  ingresso: string;
  status: string;
  observacoesMedicas: string | null;
  familiares: FamiliarDoResidente[];
};

export type SolicitacaoDoGestor = {
  id: string;
  casaId: string;
  casaNome: string;
  usuarioId: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteTelefone: string | null;
  status: string;
  quando: string;
  respondidaEm: string | null;
};

export type ResidentesDoGestor = {
  casas: { id: string; nome: string; slug: string }[];
  residentes: ResidenteDoGestor[];
  solicitacoes: SolicitacaoDoGestor[];
};

export async function residentesDoGestor(): Promise<ResidentesDoGestor> {
  const supabase = await createClientOpcional();
  if (!supabase) return { casas: [], residentes: [], solicitacoes: [] };

  const ids = await idsDasMinhasCasas(supabase);
  if (ids.length === 0) return { casas: [], residentes: [], solicitacoes: [] };

  const [casasRes, residentesRes, adesoesRes] = await Promise.all([
    supabase
      .from("ilpi")
      .select("id_ilpi, nome, slug")
      .in("id_ilpi", ids)
      .order("nome", { ascending: true }),
    supabase
      .from("residente")
      .select(
        "id_residente, id_ilpi, nome, cpf, data_nascimento, sexo, data_ingresso, status, observacoes_medicas",
      )
      .in("id_ilpi", ids)
      .order("nome", { ascending: true }),
    supabase
      .from("adesao_ilpi")
      .select(
        "id_adesao, id_ilpi, id_usuario, status, data_solicitacao, data_resposta, usuario(nome, email, telefone)",
      )
      .in("id_ilpi", ids)
      .order("data_solicitacao", { ascending: false })
      .limit(100),
  ]);

  const casas = ((casasRes.data ?? []) as unknown as {
    id_ilpi: string;
    nome: string;
    slug: string;
  }[]).map((c) => ({ id: c.id_ilpi, nome: c.nome, slug: c.slug }));

  const casaPorId = new Map(casas.map((c) => [c.id, c]));

  const linhasResidentes = (residentesRes.data ?? []) as unknown as {
    id_residente: string;
    id_ilpi: string;
    nome: string;
    cpf: string;
    data_nascimento: string;
    sexo: string;
    data_ingresso: string;
    status: string;
    observacoes_medicas: string | null;
  }[];

  const idsResidentes = linhasResidentes.map((r) => r.id_residente);
  const familiaresPorResidente = new Map<string, FamiliarDoResidente[]>();

  if (idsResidentes.length > 0) {
    const { data: famData } = await supabase
      .from("familiar_residente")
      .select(
        "id_familiar_residente, id_residente, id_usuario, parentesco, responsavel_principal, usuario(nome, email, telefone)",
      )
      .in("id_residente", idsResidentes);

    for (const f of (famData ?? []) as unknown as {
      id_familiar_residente: string;
      id_residente: string;
      id_usuario: string;
      parentesco: string;
      responsavel_principal: boolean;
      usuario: { nome: string; email: string; telefone: string | null } | null;
    }[]) {
      const lista = familiaresPorResidente.get(f.id_residente) ?? [];
      lista.push({
        id: f.id_familiar_residente,
        usuarioId: f.id_usuario,
        nome: f.usuario?.nome ?? "Familiar",
        email: f.usuario?.email ?? "",
        telefone: f.usuario?.telefone ?? null,
        parentesco: f.parentesco,
        responsavelPrincipal: Boolean(f.responsavel_principal),
      });
      familiaresPorResidente.set(f.id_residente, lista);
    }
  }

  const residentes: ResidenteDoGestor[] = linhasResidentes
    .filter((r) => casaPorId.has(r.id_ilpi))
    .map((r) => ({
      id: r.id_residente,
      casaId: r.id_ilpi,
      casaNome: casaPorId.get(r.id_ilpi)!.nome,
      nome: r.nome,
      cpf: r.cpf,
      nascimento: r.data_nascimento,
      sexo: r.sexo,
      ingresso: r.data_ingresso,
      status: r.status,
      observacoesMedicas: r.observacoes_medicas,
      familiares: (familiaresPorResidente.get(r.id_residente) ?? []).sort((a, b) =>
        Number(b.responsavelPrincipal) - Number(a.responsavelPrincipal) ||
        a.nome.localeCompare(b.nome),
      ),
    }));

  const solicitacoes: SolicitacaoDoGestor[] = ((adesoesRes.data ?? []) as unknown as {
    id_adesao: string;
    id_ilpi: string;
    id_usuario: string;
    status: string;
    data_solicitacao: string;
    data_resposta: string | null;
    usuario: { nome: string; email: string; telefone: string | null } | null;
  }[])
    .filter((a) => casaPorId.has(a.id_ilpi))
    .map((a) => ({
      id: a.id_adesao,
      casaId: a.id_ilpi,
      casaNome: casaPorId.get(a.id_ilpi)!.nome,
      usuarioId: a.id_usuario,
      solicitanteNome: a.usuario?.nome ?? "Familiar",
      solicitanteEmail: a.usuario?.email ?? "",
      solicitanteTelefone: a.usuario?.telefone ?? null,
      status: a.status,
      quando: a.data_solicitacao,
      respondidaEm: a.data_resposta,
    }));

  return { casas, residentes, solicitacoes };
}

export type MembroEquipe = {
  id: string;
  usuarioId: string;
  casaId: string;
  casaNome: string;
  nome: string;
  email: string;
  telefone: string | null;
  cargo: string;
  ativo: boolean;
  desde: string;
  ehVoce: boolean;
};

export type EquipeDoGestor = {
  casas: { id: string; nome: string; slug: string }[];
  membros: MembroEquipe[];
};

export async function equipeDoGestor(): Promise<EquipeDoGestor> {
  const supabase = await createClientOpcional();
  if (!supabase) return { casas: [], membros: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { casas: [], membros: [] };

  const ids = await idsDasMinhasCasas(supabase);
  if (ids.length === 0) return { casas: [], membros: [] };

  const [casasRes, vinculosRes] = await Promise.all([
    supabase
      .from("ilpi")
      .select("id_ilpi, nome, slug")
      .in("id_ilpi", ids)
      .order("nome", { ascending: true }),
    supabase
      .from("vinculo_ilpi")
      .select("id_vinculo, id_usuario, id_ilpi, cargo, ativo, data_vinculo, usuario(nome, email, telefone)")
      .in("id_ilpi", ids)
      .order("ativo", { ascending: false })
      .order("cargo", { ascending: true })
      .order("data_vinculo", { ascending: true }),
  ]);

  const casas = ((casasRes.data ?? []) as unknown as {
    id_ilpi: string;
    nome: string;
    slug: string;
  }[]).map((c) => ({ id: c.id_ilpi, nome: c.nome, slug: c.slug }));

  const casaPorId = new Map(casas.map((c) => [c.id, c]));

  const membros: MembroEquipe[] = ((vinculosRes.data ?? []) as unknown as {
    id_vinculo: string;
    id_usuario: string;
    id_ilpi: string;
    cargo: string;
    ativo: boolean;
    data_vinculo: string;
    usuario: { nome: string; email: string; telefone: string | null } | null;
  }[])
    .filter((v) => casaPorId.has(v.id_ilpi))
    .map((v) => ({
      id: v.id_vinculo,
      usuarioId: v.id_usuario,
      casaId: v.id_ilpi,
      casaNome: casaPorId.get(v.id_ilpi)!.nome,
      nome: v.usuario?.nome ?? "Profissional",
      email: v.usuario?.email ?? "",
      telefone: v.usuario?.telefone ?? null,
      cargo: v.cargo,
      ativo: Boolean(v.ativo),
      desde: v.data_vinculo,
      ehVoce: v.id_usuario === user.id,
    }));

  return { casas, membros };
}
