import { cache } from "react";
import { createClientOpcional, sessaoAtual } from "@/lib/supabase/server";
import { chaveDia } from "@/lib/painel/formato";

/**
 * Camada de leitura do Painel do Funcionário.
 * Sem service_role: a RLS filtra tudo pelo vínculo ativo do profissional.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TipoRegistro = "CUIDADO" | "MEDICAMENTO" | "SINAL_VITAL" | "OCORRENCIA";

export type VinculoOperacional = {
  idVinculo: string;
  casaId: string;
  casaNome: string;
  cidade: string;
  bairro: string;
  uf: string;
  cargo: "FUNCIONARIO" | "GESTOR";
};

export type UsuarioDoFuncionario = {
  id: string;
  nome: string;
  email: string;
  avatarUrl: string | null;
  ehGestor: boolean;
  vinculos: VinculoOperacional[];
};

export type ResidenteOperacional = {
  id: string;
  casaId: string;
  casaNome: string;
  idVinculo: string;
  nome: string;
  nascimento: string;
  sexo: string;
  ingresso: string;
  status: string;
  observacoesMedicas: string | null;
  registrosHoje: number;
  registros7d: number;
  ultimoRegistroEm: string | null;
  ultimoRegistroTipo: string | null;
  ultimoRegistroTitulo: string | null;
  familiares: {
    id: string;
    nome: string;
    parentesco: string;
    telefone: string | null;
    responsavelPrincipal: boolean;
  }[];
};

export type RegistroDoTurno = {
  id: string;
  residenteId: string;
  residenteNome: string;
  casaId: string;
  casaNome: string;
  tipo: string;
  titulo: string;
  descricao: string;
  criadoEm: string;
  sincronizadoEm: string;
  atrasado: boolean;
  autorNome: string;
  autorCargo: string;
  ehMeu: boolean;
};

export type PainelDoTurno = {
  casas: VinculoOperacional[];
  resumo: {
    residentesAtivos: number;
    registrosHoje: number;
    meusRegistrosHoje: number;
    ocorrencias24h: number;
    registros7d: number;
  };
  residentesRapidos: ResidenteOperacional[];
  atividadeRecente: RegistroDoTurno[];
};

export type ResidenteDetalheFuncionario = {
  id: string;
  casaId: string;
  casaNome: string;
  casaEndereco: string;
  casaBairro: string;
  casaCidade: string;
  casaUf: string;
  idVinculo: string;
  nome: string;
  nascimento: string;
  sexo: string;
  ingresso: string;
  status: string;
  observacoesMedicas: string | null;
  familiares: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    parentesco: string;
    responsavelPrincipal: boolean;
  }[];
  registrosHoje: number;
  registros7d: number;
  totalRegistros: number;
  registros: {
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
  }[];
};

export type DadosNovoRegistro = {
  casas: VinculoOperacional[];
  residentes: {
    id: string;
    casaId: string;
    casaNome: string;
    idVinculo: string;
    nome: string;
    status: string;
    observacoesMedicas: string | null;
  }[];
};

export type HistoricoDoFuncionario = {
  casas: VinculoOperacional[];
  registros: RegistroDoTurno[];
  limitado: boolean;
};

export const usuarioDoFuncionario = cache(async (): Promise<UsuarioDoFuncionario | null> => {
  const [supabase, user] = await Promise.all([createClientOpcional(), sessaoAtual()]);
  if (!supabase || !user) return null;

  const [usuarioRes, vinculosRes] = await Promise.all([
    supabase
      .from("usuario")
      .select("nome, email, avatar_url")
      .eq("id_usuario", user.id)
      .maybeSingle(),
    supabase
      .from("vinculo_ilpi")
      .select("id_vinculo, id_ilpi, cargo, ilpi(nome, cidade, bairro, uf)")
      .eq("id_usuario", user.id)
      .eq("ativo", true)
      .order("data_vinculo", { ascending: true }),
  ]);

  const linhas = (vinculosRes.data ?? []) as unknown as {
    id_vinculo: string;
    id_ilpi: string;
    cargo: string;
    ilpi: { nome: string; cidade: string; bairro: string; uf: string } | null;
  }[];

  const vinculos: VinculoOperacional[] = linhas
    .filter((v) => Boolean(v.ilpi) && (v.cargo === "FUNCIONARIO" || v.cargo === "GESTOR"))
    .map((v) => ({
      idVinculo: v.id_vinculo,
      casaId: v.id_ilpi,
      casaNome: v.ilpi!.nome,
      cidade: v.ilpi!.cidade,
      bairro: v.ilpi!.bairro,
      uf: v.ilpi!.uf,
      cargo: v.cargo as "FUNCIONARIO" | "GESTOR",
    }));

  if (vinculos.length === 0) return null;

  return {
    id: user.id,
    nome: (usuarioRes.data?.nome as string | undefined) ?? user.email ?? "Profissional",
    email: (usuarioRes.data?.email as string | undefined) ?? user.email ?? "",
    avatarUrl: (usuarioRes.data?.avatar_url as string | null | undefined) ?? null,
    ehGestor: vinculos.some((v) => v.cargo === "GESTOR"),
    vinculos,
  };
});

type LinhaResidenteBase = {
  id_residente: string;
  id_ilpi: string;
  nome: string;
  data_nascimento: string;
  sexo: string;
  data_ingresso: string;
  status: string;
  observacoes_medicas: string | null;
};

type LinhaTimelineCrua = {
  id_registro: string;
  id_residente: string;
  tipo: string;
  titulo: string;
  descricao: string;
  criado_em_dispositivo: string;
  sincronizado_em_servidor: string;
  sincronizacao_atrasada: boolean | null;
  autor_nome: string | null;
  autor_cargo: string | null;
};

export async function painelDoTurno(): Promise<PainelDoTurno> {
  const vazio: PainelDoTurno = {
    casas: [],
    resumo: {
      residentesAtivos: 0,
      registrosHoje: 0,
      meusRegistrosHoje: 0,
      ocorrencias24h: 0,
      registros7d: 0,
    },
    residentesRapidos: [],
    atividadeRecente: [],
  };

  const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
  if (!supabase || !usuario) return vazio;

  const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));
  const idsCasas = [...casaPorId.keys()];
  const meusVinculosIds = new Set(usuario.vinculos.map((v) => v.idVinculo));

  const { data: residentesData } = await supabase
    .from("residente")
    .select(
      "id_residente, id_ilpi, nome, data_nascimento, sexo, data_ingresso, status, observacoes_medicas",
    )
    .in("id_ilpi", idsCasas)
    .order("nome", { ascending: true });

  const residentes = (residentesData ?? []) as unknown as LinhaResidenteBase[];
  const idsResidentes = residentes.map((r) => r.id_residente);
  if (idsResidentes.length === 0) {
    return { ...vazio, casas: usuario.vinculos };
  }

  const residentePorId = new Map(residentes.map((r) => [r.id_residente, r]));
  const agora = new Date();
  const diaHoje = chaveDia(agora);
  const ha7d = new Date(agora.getTime() - 7 * 86_400_000).toISOString();
  const ha24h = new Date(agora.getTime() - 86_400_000).getTime();

  const [timelineRes, recentes7dRes] = await Promise.all([
    supabase
      .from("registro_timeline")
      .select(
        "id_registro, id_residente, tipo, titulo, descricao, criado_em_dispositivo, sincronizado_em_servidor, sincronizacao_atrasada, autor_nome, autor_cargo",
      )
      .in("id_residente", idsResidentes)
      .order("criado_em_dispositivo", { ascending: false })
      .limit(20),
    supabase
      .from("registro_assistencial")
      .select("id_registro, id_residente, id_vinculo, tipo, titulo, criado_em_dispositivo")
      .in("id_residente", idsResidentes)
      .gte("criado_em_dispositivo", ha7d)
      .order("criado_em_dispositivo", { ascending: false }),
  ]);

  const recentes7d = (recentes7dRes.data ?? []) as unknown as {
    id_registro: string;
    id_residente: string;
    id_vinculo: string;
    tipo: string;
    titulo: string;
    criado_em_dispositivo: string;
  }[];

  const meuRegistroIds = new Set<string>();
  const hojePorResidente = new Map<string, number>();
  const seteDiasPorResidente = new Map<string, number>();
  const ultimoPorResidente = new Map<string, { quando: string; tipo: string; titulo: string }>();

  let registrosHoje = 0;
  let meusRegistrosHoje = 0;
  let ocorrencias24h = 0;

  for (const r of recentes7d) {
    const ehMeu = meusVinculosIds.has(r.id_vinculo);
    if (ehMeu) meuRegistroIds.add(r.id_registro);

    seteDiasPorResidente.set(r.id_residente, (seteDiasPorResidente.get(r.id_residente) ?? 0) + 1);

    if (!ultimoPorResidente.has(r.id_residente)) {
      ultimoPorResidente.set(r.id_residente, {
        quando: r.criado_em_dispositivo,
        tipo: r.tipo,
        titulo: r.titulo,
      });
    }

    if (chaveDia(r.criado_em_dispositivo) === diaHoje) {
      registrosHoje += 1;
      if (ehMeu) meusRegistrosHoje += 1;
      hojePorResidente.set(r.id_residente, (hojePorResidente.get(r.id_residente) ?? 0) + 1);
    }

    if (r.tipo === "OCORRENCIA" && new Date(r.criado_em_dispositivo).getTime() >= ha24h) {
      ocorrencias24h += 1;
    }
  }

  // Confere propriedade dos registros da timeline que possam ter mais de 7 dias.
  const timelineLinhas = (timelineRes.data ?? []) as unknown as LinhaTimelineCrua[];
  const idsFora7d = timelineLinhas
    .map((t) => t.id_registro)
    .filter((id) => !recentes7d.some((r) => r.id_registro === id));

  if (idsFora7d.length > 0) {
    const { data: extras } = await supabase
      .from("registro_assistencial")
      .select("id_registro, id_vinculo")
      .in("id_registro", idsFora7d);
    for (const e of (extras ?? []) as unknown as { id_registro: string; id_vinculo: string }[]) {
      if (meusVinculosIds.has(e.id_vinculo)) meuRegistroIds.add(e.id_registro);
    }
  }

  const ativos = residentes.filter((r) => r.status === "ATIVO");

  const residentesRapidos: ResidenteOperacional[] = ativos.slice(0, 8).map((r) => {
    const vinc = casaPorId.get(r.id_ilpi)!;
    const ultimo = ultimoPorResidente.get(r.id_residente);
    return {
      id: r.id_residente,
      casaId: r.id_ilpi,
      casaNome: vinc.casaNome,
      idVinculo: vinc.idVinculo,
      nome: r.nome,
      nascimento: r.data_nascimento,
      sexo: r.sexo,
      ingresso: r.data_ingresso,
      status: r.status,
      observacoesMedicas: r.observacoes_medicas,
      registrosHoje: hojePorResidente.get(r.id_residente) ?? 0,
      registros7d: seteDiasPorResidente.get(r.id_residente) ?? 0,
      ultimoRegistroEm: ultimo?.quando ?? null,
      ultimoRegistroTipo: ultimo?.tipo ?? null,
      ultimoRegistroTitulo: ultimo?.titulo ?? null,
      familiares: [],
    };
  });

  const atividadeRecente: RegistroDoTurno[] = timelineLinhas
    .filter((t) => residentePorId.has(t.id_residente))
    .map((t) => {
      const res = residentePorId.get(t.id_residente)!;
      const vinc = casaPorId.get(res.id_ilpi)!;
      return {
        id: t.id_registro,
        residenteId: t.id_residente,
        residenteNome: res.nome,
        casaId: res.id_ilpi,
        casaNome: vinc.casaNome,
        tipo: t.tipo,
        titulo: t.titulo,
        descricao: t.descricao,
        criadoEm: t.criado_em_dispositivo,
        sincronizadoEm: t.sincronizado_em_servidor,
        atrasado: Boolean(t.sincronizacao_atrasada),
        autorNome: t.autor_nome ?? "Equipe",
        autorCargo: t.autor_cargo ?? "",
        ehMeu: meuRegistroIds.has(t.id_registro),
      };
    });

  return {
    casas: usuario.vinculos,
    resumo: {
      residentesAtivos: ativos.length,
      registrosHoje,
      meusRegistrosHoje,
      ocorrencias24h,
      registros7d: recentes7d.length,
    },
    residentesRapidos,
    atividadeRecente,
  };
}

export async function residentesDoFuncionario(): Promise<{
  casas: VinculoOperacional[];
  residentes: ResidenteOperacional[];
}> {
  const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
  if (!supabase || !usuario) return { casas: [], residentes: [] };

  const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));
  const idsCasas = [...casaPorId.keys()];

  const { data: residentesData } = await supabase
    .from("residente")
    .select(
      "id_residente, id_ilpi, nome, data_nascimento, sexo, data_ingresso, status, observacoes_medicas",
    )
    .in("id_ilpi", idsCasas)
    .order("nome", { ascending: true });

  const linhas = (residentesData ?? []) as unknown as LinhaResidenteBase[];
  if (linhas.length === 0) return { casas: usuario.vinculos, residentes: [] };

  const idsResidentes = linhas.map((r) => r.id_residente);
  const agora = new Date();
  const diaHoje = chaveDia(agora);
  const ha7d = new Date(agora.getTime() - 7 * 86_400_000).toISOString();

  const [familiaresRes, registros7dRes] = await Promise.all([
    supabase
      .from("familiar_residente")
      .select(
        "id_familiar_residente, id_residente, parentesco, responsavel_principal, usuario(nome, telefone)",
      )
      .in("id_residente", idsResidentes),
    supabase
      .from("registro_assistencial")
      .select("id_residente, tipo, titulo, criado_em_dispositivo")
      .in("id_residente", idsResidentes)
      .gte("criado_em_dispositivo", ha7d)
      .order("criado_em_dispositivo", { ascending: false }),
  ]);

  const familiaresPorResidente = new Map<string, ResidenteOperacional["familiares"]>();
  for (const f of (familiaresRes.data ?? []) as unknown as {
    id_familiar_residente: string;
    id_residente: string;
    parentesco: string;
    responsavel_principal: boolean;
    usuario: { nome: string; telefone: string | null } | null;
  }[]) {
    const lista = familiaresPorResidente.get(f.id_residente) ?? [];
    lista.push({
      id: f.id_familiar_residente,
      nome: f.usuario?.nome ?? "Familiar",
      parentesco: f.parentesco,
      telefone: f.usuario?.telefone ?? null,
      responsavelPrincipal: f.responsavel_principal,
    });
    familiaresPorResidente.set(f.id_residente, lista);
  }

  const hojePorRes = new Map<string, number>();
  const setePorRes = new Map<string, number>();
  const ultimoPorRes = new Map<string, { quando: string; tipo: string; titulo: string }>();

  for (const r of (registros7dRes.data ?? []) as unknown as {
    id_residente: string;
    tipo: string;
    titulo: string;
    criado_em_dispositivo: string;
  }[]) {
    setePorRes.set(r.id_residente, (setePorRes.get(r.id_residente) ?? 0) + 1);
    if (chaveDia(r.criado_em_dispositivo) === diaHoje) {
      hojePorRes.set(r.id_residente, (hojePorRes.get(r.id_residente) ?? 0) + 1);
    }
    if (!ultimoPorRes.has(r.id_residente)) {
      ultimoPorRes.set(r.id_residente, {
        quando: r.criado_em_dispositivo,
        tipo: r.tipo,
        titulo: r.titulo,
      });
    }
  }

  const residentes: ResidenteOperacional[] = linhas.map((r) => {
    const vinc = casaPorId.get(r.id_ilpi)!;
    const ultimo = ultimoPorRes.get(r.id_residente);
    const fams = (familiaresPorResidente.get(r.id_residente) ?? []).sort(
      (a, b) => Number(b.responsavelPrincipal) - Number(a.responsavelPrincipal),
    );
    return {
      id: r.id_residente,
      casaId: r.id_ilpi,
      casaNome: vinc.casaNome,
      idVinculo: vinc.idVinculo,
      nome: r.nome,
      nascimento: r.data_nascimento,
      sexo: r.sexo,
      ingresso: r.data_ingresso,
      status: r.status,
      observacoesMedicas: r.observacoes_medicas,
      registrosHoje: hojePorRes.get(r.id_residente) ?? 0,
      registros7d: setePorRes.get(r.id_residente) ?? 0,
      ultimoRegistroEm: ultimo?.quando ?? null,
      ultimoRegistroTipo: ultimo?.tipo ?? null,
      ultimoRegistroTitulo: ultimo?.titulo ?? null,
      familiares: fams,
    };
  });

  return { casas: usuario.vinculos, residentes };
}

export const residenteDoFuncionario = cache(
  async (id: string): Promise<ResidenteDetalheFuncionario | null> => {
    if (!UUID_RE.test(id)) return null;

    const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
    if (!supabase || !usuario) return null;

    const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));

    const { data: resData } = await supabase
      .from("residente")
      .select(
        "id_residente, id_ilpi, nome, data_nascimento, sexo, data_ingresso, status, observacoes_medicas, ilpi(nome, endereco, bairro, cidade, uf)",
      )
      .eq("id_residente", id)
      .maybeSingle();

    if (!resData) return null;

    const r = resData as unknown as LinhaResidenteBase & {
      ilpi: { nome: string; endereco: string; bairro: string; cidade: string; uf: string } | null;
    };

    const vinc = casaPorId.get(r.id_ilpi);
    if (!vinc) return null;

    const agora = new Date();
    const diaHoje = chaveDia(agora);
    const ha7d = new Date(agora.getTime() - 7 * 86_400_000).toISOString();

    const [familiaresRes, timelineRes, contagemTotalRes, contagem7dRes] = await Promise.all([
      supabase
        .from("familiar_residente")
        .select(
          "id_familiar_residente, parentesco, responsavel_principal, usuario(nome, email, telefone)",
        )
        .eq("id_residente", id),
      supabase
        .from("registro_timeline")
        .select(
          "id_registro, tipo, titulo, descricao, criado_em_dispositivo, sincronizado_em_servidor, sincronizacao_atrasada, autor_nome, autor_cargo",
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
        .gte("criado_em_dispositivo", ha7d),
    ]);

    const familiares = ((familiaresRes.data ?? []) as unknown as {
      id_familiar_residente: string;
      parentesco: string;
      responsavel_principal: boolean;
      usuario: { nome: string; email: string; telefone: string | null } | null;
    }[])
      .map((f) => ({
        id: f.id_familiar_residente,
        nome: f.usuario?.nome ?? "Familiar",
        email: f.usuario?.email ?? "",
        telefone: f.usuario?.telefone ?? null,
        parentesco: f.parentesco,
        responsavelPrincipal: f.responsavel_principal,
      }))
      .sort((a, b) => Number(b.responsavelPrincipal) - Number(a.responsavelPrincipal));

    const registros = ((timelineRes.data ?? []) as unknown as Omit<LinhaTimelineCrua, "id_residente">[]).map(
      (t) => ({
        id: t.id_registro,
        residenteId: r.id_residente,
        residenteNome: r.nome,
        tipo: t.tipo,
        titulo: t.titulo,
        descricao: t.descricao,
        criadoEm: t.criado_em_dispositivo,
        sincronizadoEm: t.sincronizado_em_servidor,
        atrasado: Boolean(t.sincronizacao_atrasada),
        autorNome: t.autor_nome ?? "Equipe",
        autorCargo: t.autor_cargo ?? "",
      }),
    );

    const registrosHoje = registros.filter((reg) => chaveDia(reg.criadoEm) === diaHoje).length;

    return {
      id: r.id_residente,
      casaId: r.id_ilpi,
      casaNome: r.ilpi?.nome ?? vinc.casaNome,
      casaEndereco: r.ilpi?.endereco ?? "",
      casaBairro: r.ilpi?.bairro ?? vinc.bairro,
      casaCidade: r.ilpi?.cidade ?? vinc.cidade,
      casaUf: r.ilpi?.uf ?? vinc.uf,
      idVinculo: vinc.idVinculo,
      nome: r.nome,
      nascimento: r.data_nascimento,
      sexo: r.sexo,
      ingresso: r.data_ingresso,
      status: r.status,
      observacoesMedicas: r.observacoes_medicas,
      familiares,
      registrosHoje,
      registros7d: contagem7dRes.count ?? 0,
      totalRegistros: contagemTotalRes.count ?? registros.length,
      registros,
    };
  },
);

export async function dadosParaNovoRegistro(): Promise<DadosNovoRegistro> {
  const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
  if (!supabase || !usuario) return { casas: [], residentes: [] };

  const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));
  const idsCasas = [...casaPorId.keys()];

  const { data } = await supabase
    .from("residente")
    .select("id_residente, id_ilpi, nome, status, observacoes_medicas")
    .in("id_ilpi", idsCasas)
    .order("nome", { ascending: true });

  const residentes = ((data ?? []) as unknown as {
    id_residente: string;
    id_ilpi: string;
    nome: string;
    status: string;
    observacoes_medicas: string | null;
  }[]).map((r) => {
    const vinc = casaPorId.get(r.id_ilpi)!;
    return {
      id: r.id_residente,
      casaId: r.id_ilpi,
      casaNome: vinc.casaNome,
      idVinculo: vinc.idVinculo,
      nome: r.nome,
      status: r.status,
      observacoesMedicas: r.observacoes_medicas,
    };
  });

  return { casas: usuario.vinculos, residentes };
}

export async function historicoDoFuncionario(): Promise<HistoricoDoFuncionario> {
  const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
  if (!supabase || !usuario) return { casas: [], registros: [], limitado: false };

  const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));
  const idsCasas = [...casaPorId.keys()];
  const meusVinculosIds = new Set(usuario.vinculos.map((v) => v.idVinculo));

  const { data: residentesData } = await supabase
    .from("residente")
    .select("id_residente, id_ilpi, nome")
    .in("id_ilpi", idsCasas);

  const residentes = (residentesData ?? []) as unknown as {
    id_residente: string;
    id_ilpi: string;
    nome: string;
  }[];
  if (residentes.length === 0) return { casas: usuario.vinculos, registros: [], limitado: false };

  const residentePorId = new Map(residentes.map((r) => [r.id_residente, r]));
  const idsResidentes = residentes.map((r) => r.id_residente);

  const { data: timelineData } = await supabase
    .from("registro_timeline")
    .select(
      "id_registro, id_residente, tipo, titulo, descricao, criado_em_dispositivo, sincronizado_em_servidor, sincronizacao_atrasada, autor_nome, autor_cargo",
    )
    .in("id_residente", idsResidentes)
    .order("criado_em_dispositivo", { ascending: false })
    .limit(201);

  const linhasCruas = (timelineData ?? []) as unknown as LinhaTimelineCrua[];
  const limitado = linhasCruas.length > 200;
  const linhas = limitado ? linhasCruas.slice(0, 200) : linhasCruas;

  const idsRegistros = linhas.map((l) => l.id_registro);
  const meusIds = new Set<string>();

  if (idsRegistros.length > 0) {
    const { data: vinculosReg } = await supabase
      .from("registro_assistencial")
      .select("id_registro, id_vinculo")
      .in("id_registro", idsRegistros);

    for (const v of (vinculosReg ?? []) as unknown as { id_registro: string; id_vinculo: string }[]) {
      if (meusVinculosIds.has(v.id_vinculo)) meusIds.add(v.id_registro);
    }
  }

  const registros: RegistroDoTurno[] = linhas
    .filter((t) => residentePorId.has(t.id_residente))
    .map((t) => {
      const res = residentePorId.get(t.id_residente)!;
      const vinc = casaPorId.get(res.id_ilpi)!;
      return {
        id: t.id_registro,
        residenteId: t.id_residente,
        residenteNome: res.nome,
        casaId: res.id_ilpi,
        casaNome: vinc.casaNome,
        tipo: t.tipo,
        titulo: t.titulo,
        descricao: t.descricao,
        criadoEm: t.criado_em_dispositivo,
        sincronizadoEm: t.sincronizado_em_servidor,
        atrasado: Boolean(t.sincronizacao_atrasada),
        autorNome: t.autor_nome ?? "Equipe",
        autorCargo: t.autor_cargo ?? "",
        ehMeu: meusIds.has(t.id_registro),
      };
    });

  return { casas: usuario.vinculos, registros, limitado };
}

// ---- Central de aprovações (adesao_ilpi pela equipe) -----------------------

export type SolicitacaoEquipe = {
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

export type AprovacoesDoFuncionario = {
  casas: VinculoOperacional[];
  solicitacoes: SolicitacaoEquipe[];
  residentesAtivos: { id: string; casaId: string; nome: string }[];
};

export async function aprovacoesDoFuncionario(): Promise<AprovacoesDoFuncionario> {
  const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
  if (!supabase || !usuario) {
    return { casas: [], solicitacoes: [], residentesAtivos: [] };
  }

  const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));
  const idsCasas = [...casaPorId.keys()];

  const [adesoesRes, residentesRes] = await Promise.all([
    supabase
      .from("adesao_ilpi")
      .select(
        "id_adesao, id_ilpi, id_usuario, status, data_solicitacao, data_resposta, usuario(nome, email, telefone)",
      )
      .in("id_ilpi", idsCasas)
      .order("data_solicitacao", { ascending: false })
      .limit(100),
    supabase
      .from("residente")
      .select("id_residente, id_ilpi, nome")
      .in("id_ilpi", idsCasas)
      .eq("status", "ATIVO")
      .order("nome", { ascending: true }),
  ]);

  const solicitacoes: SolicitacaoEquipe[] = ((adesoesRes.data ?? []) as unknown as {
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
      casaNome: casaPorId.get(a.id_ilpi)!.casaNome,
      usuarioId: a.id_usuario,
      solicitanteNome: a.usuario?.nome ?? "Familiar",
      solicitanteEmail: a.usuario?.email ?? "",
      solicitanteTelefone: a.usuario?.telefone ?? null,
      status: a.status,
      quando: a.data_solicitacao,
      respondidaEm: a.data_resposta,
    }));

  const residentesAtivos = ((residentesRes.data ?? []) as unknown as {
    id_residente: string;
    id_ilpi: string;
    nome: string;
  }[]).map((r) => ({
    id: r.id_residente,
    casaId: r.id_ilpi,
    nome: r.nome,
  }));

  return { casas: usuario.vinculos, solicitacoes, residentesAtivos };
}

// ---- Chat / Suporte da equipe ----------------------------------------------

export type MensagemEquipeChat = {
  id: string;
  conversaId: string;
  conteudo: string;
  dataHora: string;
  ehMinha: boolean;
  ehFamiliar: boolean;
  autorNome: string;
};

export type ConversaEquipe = {
  id: string;
  casaId: string;
  casaNome: string;
  familiarId: string;
  familiarNome: string;
  familiarEmail: string;
  familiarTelefone: string | null;
  criadaEm: string;
  mensagens: MensagemEquipeChat[];
};

export type ContatoDisponivelChat = {
  casaId: string;
  casaNome: string;
  usuarioId: string;
  nome: string;
  email: string;
  origem: "Familiar" | "Solicitante";
};

export type ChatDaEquipe = {
  casas: VinculoOperacional[];
  conversas: ConversaEquipe[];
  contatosDisponiveis: ContatoDisponivelChat[];
};

export async function chatDaEquipe(): Promise<ChatDaEquipe> {
  const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
  if (!supabase || !usuario) return { casas: [], conversas: [], contatosDisponiveis: [] };

  const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));
  const idsCasas = [...casaPorId.keys()];

  const [convRes, equipeRes, residentesRes, adesoesRes] = await Promise.all([
    supabase
      .from("conversa")
      .select("id_conversa, id_ilpi, id_usuario, data_criacao, usuario(nome, email, telefone)")
      .in("id_ilpi", idsCasas)
      .order("data_criacao", { ascending: false }),
    supabase
      .from("vinculo_ilpi")
      .select("id_usuario, usuario(nome)")
      .in("id_ilpi", idsCasas),
    supabase
      .from("residente")
      .select("id_residente, id_ilpi")
      .in("id_ilpi", idsCasas),
    supabase
      .from("adesao_ilpi")
      .select("id_ilpi, id_usuario, usuario(nome, email)")
      .in("id_ilpi", idsCasas)
      .in("status", ["PENDENTE", "APROVADA"]),
  ]);

  const nomeEquipePorUsuario = new Map<string, string>();
  for (const e of (equipeRes.data ?? []) as unknown as {
    id_usuario: string;
    usuario: { nome: string } | null;
  }[]) {
    if (e.usuario?.nome) nomeEquipePorUsuario.set(e.id_usuario, e.usuario.nome);
  }

  const linhasConv = ((convRes.data ?? []) as unknown as {
    id_conversa: string;
    id_ilpi: string;
    id_usuario: string;
    data_criacao: string;
    usuario: { nome: string; email: string; telefone: string | null } | null;
  }[]).filter((c) => casaPorId.has(c.id_ilpi));

  const idsConv = linhasConv.map((c) => c.id_conversa);
  const convPorId = new Map(linhasConv.map((c) => [c.id_conversa, c]));
  const mensagensPorConv = new Map<string, MensagemEquipeChat[]>();

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
      const conv = convPorId.get(m.id_conversa);
      if (!conv) continue;
      const ehFamiliar = m.id_usuario === conv.id_usuario;
      const ehMinha = m.id_usuario === usuario.id;
      const autorNome = ehMinha
        ? "Você"
        : ehFamiliar
          ? (conv.usuario?.nome ?? "Familiar")
          : (nomeEquipePorUsuario.get(m.id_usuario) ?? "Equipe");

      const lista = mensagensPorConv.get(m.id_conversa) ?? [];
      lista.push({
        id: m.id_mensagem,
        conversaId: m.id_conversa,
        conteudo: m.conteudo,
        dataHora: m.data_hora,
        ehMinha,
        ehFamiliar,
        autorNome,
      });
      mensagensPorConv.set(m.id_conversa, lista);
    }
  }

  const conversas: ConversaEquipe[] = linhasConv
    .map((c) => ({
      id: c.id_conversa,
      casaId: c.id_ilpi,
      casaNome: casaPorId.get(c.id_ilpi)!.casaNome,
      familiarId: c.id_usuario,
      familiarNome: c.usuario?.nome ?? "Familiar",
      familiarEmail: c.usuario?.email ?? "",
      familiarTelefone: c.usuario?.telefone ?? null,
      criadaEm: c.data_criacao,
      mensagens: mensagensPorConv.get(c.id_conversa) ?? [],
    }))
    .sort((a, b) => {
      const ultA = a.mensagens[a.mensagens.length - 1]?.dataHora ?? a.criadaEm;
      const ultB = b.mensagens[b.mensagens.length - 1]?.dataHora ?? b.criadaEm;
      return ultB.localeCompare(ultA);
    });

  // Contatos (familiares ou solicitantes) ainda sem conversa aberta
  const chavesConversa = new Set(conversas.map((c) => `${c.casaId}:${c.familiarId}`));
  const contatosMap = new Map<string, ContatoDisponivelChat>();

  const resLista = (residentesRes.data ?? []) as unknown as {
    id_residente: string;
    id_ilpi: string;
  }[];
  if (resLista.length > 0) {
    const casaPorRes = new Map(resLista.map((r) => [r.id_residente, r.id_ilpi]));
    const { data: famData } = await supabase
      .from("familiar_residente")
      .select("id_residente, id_usuario, usuario(nome, email)")
      .in("id_residente", resLista.map((r) => r.id_residente));

    for (const f of (famData ?? []) as unknown as {
      id_residente: string;
      id_usuario: string;
      usuario: { nome: string; email: string } | null;
    }[]) {
      const casaId = casaPorRes.get(f.id_residente);
      if (!casaId || !casaPorId.has(casaId) || !f.usuario) continue;
      const chave = `${casaId}:${f.id_usuario}`;
      if (chavesConversa.has(chave) || contatosMap.has(chave)) continue;
      contatosMap.set(chave, {
        casaId,
        casaNome: casaPorId.get(casaId)!.casaNome,
        usuarioId: f.id_usuario,
        nome: f.usuario.nome,
        email: f.usuario.email,
        origem: "Familiar",
      });
    }
  }

  for (const a of (adesoesRes.data ?? []) as unknown as {
    id_ilpi: string;
    id_usuario: string;
    usuario: { nome: string; email: string } | null;
  }[]) {
    if (!casaPorId.has(a.id_ilpi) || !a.usuario) continue;
    const chave = `${a.id_ilpi}:${a.id_usuario}`;
    if (chavesConversa.has(chave) || contatosMap.has(chave)) continue;
    contatosMap.set(chave, {
      casaId: a.id_ilpi,
      casaNome: casaPorId.get(a.id_ilpi)!.casaNome,
      usuarioId: a.id_usuario,
      nome: a.usuario.nome,
      email: a.usuario.email,
      origem: "Solicitante",
    });
  }

  const contatosDisponiveis = [...contatosMap.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );

  return { casas: usuario.vinculos, conversas, contatosDisponiveis };
}

// ---- Minha escala (escala_turno — migration 0015) --------------------------

export type TurnoEscala = "MANHA" | "TARDE" | "NOITE" | "PLANTAO_12H" | "INTEGRAL";

export type ItemEscala = {
  id: string;
  vinculoId: string;
  casaId: string;
  casaNome: string;
  profissionalNome: string;
  profissionalCargo: string;
  ehMeu: boolean;
  data: string;
  horaInicio: string;
  horaFim: string;
  turno: TurnoEscala;
  observacoes: string | null;
};

export type EscalaDoFuncionario = {
  disponivel: boolean;
  casas: VinculoOperacional[];
  turnos: ItemEscala[];
};

export async function escalaDoFuncionario(): Promise<EscalaDoFuncionario> {
  const [supabase, usuario] = await Promise.all([createClientOpcional(), usuarioDoFuncionario()]);
  if (!supabase || !usuario) return { disponivel: true, casas: [], turnos: [] };

  const casaPorId = new Map(usuario.vinculos.map((v) => [v.casaId, v]));
  const idsCasas = [...casaPorId.keys()];
  const meusVinculosIds = new Set(usuario.vinculos.map((v) => v.idVinculo));

  const ha7d = chaveDia(new Date(Date.now() - 7 * 86_400_000));

  const { data, error } = await supabase
    .from("escala_turno")
    .select(
      "id_escala, id_vinculo, data, hora_inicio, hora_fim, turno, observacoes, vinculo_ilpi(id_ilpi, cargo, usuario(nome))",
    )
    .gte("data", ha7d)
    .order("data", { ascending: true })
    .order("hora_inicio", { ascending: true })
    .limit(200);

  if (error) {
    // 42P01 / PGRST205 = migration 0015 ainda não aplicada no banco.
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { disponivel: false, casas: usuario.vinculos, turnos: [] };
    }
    return { disponivel: true, casas: usuario.vinculos, turnos: [] };
  }

  const turnos: ItemEscala[] = ((data ?? []) as unknown as {
    id_escala: string;
    id_vinculo: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    turno: TurnoEscala;
    observacoes: string | null;
    vinculo_ilpi: {
      id_ilpi: string;
      cargo: string;
      usuario: { nome: string } | null;
    } | null;
  }[])
    .filter((e) => Boolean(e.vinculo_ilpi) && idsCasas.includes(e.vinculo_ilpi!.id_ilpi))
    .map((e) => {
      const casaId = e.vinculo_ilpi!.id_ilpi;
      return {
        id: e.id_escala,
        vinculoId: e.id_vinculo,
        casaId,
        casaNome: casaPorId.get(casaId)!.casaNome,
        profissionalNome: e.vinculo_ilpi?.usuario?.nome ?? "Profissional",
        profissionalCargo: e.vinculo_ilpi?.cargo ?? "FUNCIONARIO",
        ehMeu: meusVinculosIds.has(e.id_vinculo),
        data: e.data,
        horaInicio: e.hora_inicio.slice(0, 5),
        horaFim: e.hora_fim.slice(0, 5),
        turno: e.turno,
        observacoes: e.observacoes,
      };
    });

  return { disponivel: true, casas: usuario.vinculos, turnos };
}
