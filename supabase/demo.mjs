#!/usr/bin/env node
/**
 * Dados de demonstração do painel do gestor (Ginkle).
 *
 * Cria as contas, as casas, a equipe, os residentes, os registros dos últimos
 * sete dias, solicitações de entrada e avaliações. Tudo passa pela RLS com a
 * chave pública, igual ao app — nada de service key.
 *
 *   $env:DEMO_PW = "senha-dos-usuarios-de-demo"
 *   node supabase/demo.mjs
 *
 * É idempotente: rodar de novo não duplica. Para desfazer, rode
 * supabase/demo-limpar.sql no SQL Editor.
 *
 * Sobre `sincronizado_em_servidor`: no app quem grava é o servidor. Aqui o
 * script preenche na mão (segundos depois do registro), porque é dado de
 * demonstração e o valor padrão (now()) marcaria tudo como "sincronizado com
 * atraso". Um registro de propósito fica com 25 minutos de atraso, para a
 * sinalização aparecer no painel.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------- ambiente --

function lerEnv() {
  const caminho = new URL("../.env.local", import.meta.url);
  const env = {};
  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = lerEnv();
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SENHA = process.env.DEMO_PW;

if (!URL_SB || !CHAVE) {
  console.error("Faltou NEXT_PUBLIC_SUPABASE_URL/KEY no .env.local.");
  process.exit(1);
}
if (!SENHA || SENHA.length < 6) {
  console.error("Defina DEMO_PW (mínimo 6 caracteres) antes de rodar.");
  process.exit(1);
}

const log = (...args) => console.log("·", ...args);

function cliente() {
  return createClient(URL_SB, CHAVE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// --------------------------------------------------------------- utilidades --

// contador: garante CPF único para os residentes do demo. Começa num ponto
// aleatório porque o banco pode já ter residentes de execuções anteriores.
let sequenciaCpf = Math.floor(Math.random() * 700000000);

/** Gera um CPF demonstrativo (dígitos verificadores válidos) e diferente a cada chamada. */
function proximoCpf() {
  sequenciaCpf += 1;
  return cpf(String(100000000 + (sequenciaCpf % 800000000)));
}

/** Completa os dígitos verificadores de um CPF a partir dos 9 primeiros. */
function cpf(base9) {
  const dv = (base, pesoInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const b = base9.replace(/\D/g, "").slice(0, 9);
  const d1 = dv(b, 10);
  const d2 = dv(`${b}${d1}`, 11);
  return `${b}${d1}${d2}`;
}

/** Completa os dígitos verificadores de um CNPJ a partir dos 12 primeiros. */
function cnpj(base12) {
  const dv = (base) => {
    let peso = base.length - 7;
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) {
      soma += Number(base[i]) * peso;
      peso -= 1;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const b = base12.replace(/\D/g, "").slice(0, 12);
  const d1 = dv(b);
  const d2 = dv(`${b}${d1}`);
  const d = `${b}${d1}${d2}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

async function criarOuEntrar(cliente, { email, nome }) {
  const { data, error } = await cliente.auth.signUp({
    email,
    password: SENHA,
    options: { data: { nome } },
  });

  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      const { error: erroLogin } = await cliente.auth.signInWithPassword({
        email,
        password: SENHA,
      });
      if (erroLogin) {
        throw new Error(`Já existe conta para ${email}, mas a senha de DEMO_PW não bate.`);
      }
      return "existente";
    }
    throw new Error(`signUp ${email}: ${error.message}`);
  }

  if (!data.session) {
    // Só acontece com "Confirm email" ligado no Supabase.
    throw new Error(
      `Cadastro de ${email} pediu confirmação de e-mail. Desligue em Authentication → Sign In / Providers → Email.`,
    );
  }
  return "criado";
}

function exigir(erro, contexto) {
  if (erro) {
    throw new Error(
      `${contexto}: ${erro.message} [code=${erro.code ?? "?"} details=${erro.details ?? ""} hint=${erro.hint ?? ""}]`,
    );
  }
}

// ------------------------------------------------------------------- dados --

const CONTAS = {
  gestor: { email: "gestor.demo@ginkle.me", nome: "Helena Prado" },
  equipe: [
    { email: "ana.paula@ginkle.me", nome: "Ana Paula Ferraz" },
    { email: "carlos.mendes@ginkle.me", nome: "Carlos Mendes" },
    { email: "beatriz.nogueira@ginkle.me", nome: "Beatriz Nogueira" },
  ],
  familiares: [
    { email: "maria.souza@ginkle.me", nome: "Maria Souza Lima" },
    { email: "joao.pereira@ginkle.me", nome: "João Pereira" },
  ],
};

const CASAS = [
  {
    slug: "residencial-aurora",
    nome: "Residencial Aurora",
    cnpj: cnpj("318407720001"),
    telefone: "(13) 3474-2080",
    email: "contato@residencialaurora.com.br",
    endereco: "Rua das Gaivotas, 480",
    cidade: "Praia Grande",
    bairro: "Boqueirão",
    uf: "SP",
    vagas: 3,
    destaque: "Mais procurada",
    tags: ["Cuidados 24h", "Fisioterapia", "Visitas diárias"],
    descricao:
      "Casa de dois pavimentos com jardim interno, equipe de enfermagem 24 horas e fisioterapia três vezes por semana. Visitas todos os dias, das 9h às 19h.",
    fotos: [
      { url: "/images/casa.jpg", legenda: "Fachada e jardim" },
      { url: "/images/velhos.jpg", legenda: "Sala de convivência" },
      { url: "/images/famillia.jpg", legenda: "Refeitório" },
    ],
    planos: [
      { nome: "Quarto compartilhado", valor: 3200, descricao: "Acomoda dois residentes, com banheiro adaptado." },
      { nome: "Suíte individual", valor: 4300, descricao: "Suíte com banheiro próprio e janela para o jardim." },
    ],
    residentes: [
      { nome: "Alzira Nunes Barbosa", nascimento: "1938-04-12", sexo: "F", ingresso: "2021-03-02", status: "ATIVO" },
      { nome: "Sebastião Ribeiro", nascimento: "1942-11-30", sexo: "M", ingresso: "2022-08-19", status: "ATIVO" },
      { nome: "Nair Tavares Duarte", nascimento: "1945-06-05", sexo: "F", ingresso: "2023-01-14", status: "ATIVO" },
      { nome: "José Bonifácio Alves", nascimento: "1936-02-27", sexo: "M", ingresso: "2019-10-08", status: "ALTA" },
    ],
  },
  {
    slug: "casa-serenidade",
    nome: "Casa Serenidade",
    cnpj: cnpj("452978430001"),
    telefone: "(13) 3222-7140",
    email: "contato@casaserenidade.com.br",
    endereco: "Rua Galeão Coutinho, 212",
    cidade: "Santos",
    bairro: "Gonzaga",
    uf: "SP",
    vagas: 5,
    destaque: null,
    tags: ["Cuidados 24h", "Jardim", "Atividades"],
    descricao:
      "Casa térrea a duas quadras da praia, com horta, oficina de memória e acompanhamento nutricional. Rotina calma, equipe fixa há mais de dez anos.",
    fotos: [
      { url: "/images/velhos2.jpg", legenda: "Varanda" },
      { url: "/images/casa.jpg", legenda: "Área externa" },
    ],
    planos: [{ nome: "Padrão", valor: 2900, descricao: "Quarto compartilhado com acompanhamento integral." }],
    residentes: [
      { nome: "Dercília Antunes", nascimento: "1940-09-03", sexo: "F", ingresso: "2020-05-22", status: "ATIVO" },
      { nome: "Waldemar Coelho", nascimento: "1934-12-17", sexo: "M", ingresso: "2018-07-30", status: "ATIVO" },
      { nome: "Íris Camargo Belmonte", nascimento: "1948-01-25", sexo: "F", ingresso: "2024-02-05", status: "ATIVO" },
    ],
  },
  {
    // terceira casa de propósito em rascunho: é o estado que o botão
    // "Publicar no diretório" muda, e serve para mostrar a tela sem exposição.
    slug: "recanto-das-palmeiras",
    nome: "Recanto das Palmeiras",
    cnpj: cnpj("196603540001"),
    telefone: "(13) 3561-4455",
    email: "contato@recantodaspalmeiras.com.br",
    endereco: "Rua Antônio Cândido, 77",
    cidade: "Praia Grande",
    bairro: "Canto do Forte",
    uf: "SP",
    vagas: 0,
    destaque: null,
    publicado: false,
    tags: ["Cuidados 24h", "Atividades"],
    descricao:
      "Casa em preparação: reforma do quintal e contratação da equipe de enfermagem em andamento. A página só entra no diretório quando a casa estiver pronta.",
    fotos: [{ url: "/images/casa.jpg", legenda: "Fachada" }],
    planos: [{ nome: "Padrão", valor: 3100, descricao: "Quarto compartilhado com acompanhamento integral." }],
    residentes: [
      { nome: "Terezinha Barbosa Lima", nascimento: "1943-03-19", sexo: "F", ingresso: "2024-05-10", status: "ATIVO" },
      { nome: "Gentil Rocha Pires", nascimento: "1946-08-01", sexo: "M", ingresso: "2024-06-21", status: "ATIVO" },
    ],
  },
];

const MODELOS_REGISTRO = [
  { tipo: "CUIDADO", titulo: "Banho assistido", descricao: "Banho no período da manhã, sem intercorrências." },
  { tipo: "MEDICAMENTO", titulo: "Losartana 50 mg", descricao: "Administrado após o café da manhã." },
  { tipo: "SINAL_VITAL", titulo: "Pressão arterial 128/82", descricao: "Aferida em repouso. Dentro da faixa esperada." },
  { tipo: "CUIDADO", titulo: "Fisioterapia motora", descricao: "Alongamentos e caminhada curta no corredor." },
  { tipo: "OCORRENCIA", titulo: "Recusa parcial do jantar", descricao: "Recusou o prato principal e aceitou a sopa. Enfermagem avisada." },
  { tipo: "MEDICAMENTO", titulo: "Vitamina D 2.000 UI", descricao: "Administrada junto ao almoço." },
  { tipo: "SINAL_VITAL", titulo: "Glicemia 104 mg/dL", descricao: "Medida antes do café da manhã, em jejum." },
  { tipo: "CUIDADO", titulo: "Troca de curativo", descricao: "Curativo na perna esquerda trocado, pele íntegra." },
];

// ------------------------------------------------------------------- fluxo --

async function main() {
  log("entrando com as contas de demonstração");
  const gestor = cliente();
  const estado = await criarOuEntrar(gestor, CONTAS.gestor);
  log(estado === "criado" ? "conta do gestor criada" : "conta do gestor já existia");

  const equipe = [];
  for (const pessoa of CONTAS.equipe) {
    const c = cliente();
    await criarOuEntrar(c, pessoa);
    equipe.push({ ...pessoa, cliente: c });
  }
  log(`${equipe.length} contas de funcionário prontas`);

  const familiares = [];
  for (const pessoa of CONTAS.familiares) {
    const c = cliente();
    await criarOuEntrar(c, pessoa);
    familiares.push({ ...pessoa, cliente: c });
  }
  log(`${familiares.length} contas de familiar prontas`);

  const idsCasas = [];

  for (const [indice, casa] of CASAS.entries()) {
    // ---- casa: a RPC cria a casa e o vínculo de gestor numa transação
    let idCasa;
    const { data: existente } = await gestor
      .from("ilpi")
      .select("id_ilpi")
      .eq("slug", casa.slug)
      .maybeSingle();

    if (existente) {
      idCasa = existente.id_ilpi;
      log(`casa "${casa.nome}" já existia`);
    } else {
      const { data, error } = await gestor.rpc("criar_ilpi", {
        p_slug: casa.slug,
        p_cnpj: casa.cnpj,
        p_nome: casa.nome,
        p_telefone: casa.telefone,
        p_email: casa.email,
        p_endereco: casa.endereco,
        p_cidade: casa.cidade,
        p_bairro: casa.bairro,
        p_descricao: casa.descricao,
        p_site: null,
        p_uf: casa.uf,
      });
      exigir(error, `criar_ilpi ${casa.slug}`);
      idCasa = data;
      log(`casa "${casa.nome}" criada`);
    }
    idsCasas.push(idCasa);

    // ---- vitrine: vagas, selo, tags e situação não fazem parte da RPC
    exigir(
      (
        await gestor
          .from("ilpi")
          .update({
            vagas: casa.vagas,
            destaque: casa.destaque,
            tags: casa.tags,
            publicado: casa.publicado ?? true,
          })
          .eq("id_ilpi", idCasa)
      ).error,
      `vitrine ${casa.slug}`,
    );

    // ---- fotos
    const { count: fotos } = await gestor
      .from("foto_ilpi")
      .select("id_foto", { count: "exact", head: true })
      .eq("id_ilpi", idCasa);
    if (!fotos) {
      exigir(
        (
          await gestor
            .from("foto_ilpi")
            .insert(casa.fotos.map((foto, ordem) => ({ ...foto, id_ilpi: idCasa, ordem })))
        ).error,
        `fotos ${casa.slug}`,
      );
    }

    // ---- planos
    const { count: planos } = await gestor
      .from("plano")
      .select("id_plano", { count: "exact", head: true })
      .eq("id_ilpi", idCasa);
    if (!planos) {
      exigir(
        (
          await gestor
            .from("plano")
            .insert(casa.planos.map((plano) => ({ ...plano, id_ilpi: idCasa })))
        ).error,
        `planos ${casa.slug}`,
      );
    }

    // ---- residentes (cpf gerado com dígito verificador válido)
    const { data: residentesExistentes } = await gestor
      .from("residente")
      .select("id_residente, nome, status")
      .eq("id_ilpi", idCasa);

    let residentes = residentesExistentes ?? [];
    if (residentes.length === 0) {
      const base = casa.residentes.map((residente, i) => ({
        id_ilpi: idCasa,
        nome: residente.nome,
        data_nascimento: residente.nascimento,
        sexo: residente.sexo,
        observacoes_medicas:
          i === 0 ? "Hipertensa, uso contínuo de losartana. Sem restrição alimentar." : null,
        data_ingresso: residente.ingresso,
        status: residente.status,
      }));

      // Sem `.select()`: com RETURNING, o Postgres exige que a linha nova passe
      // também na policy de SELECT (pode_ver_residente), que consulta residente
      // por subquery — e a linha recém-inserida ainda não está no snapshot da
      // própria instrução. Resultado: 42501. Insere e lê depois.
      //
      // A inserção é atômica: ou entram todos, ou nenhum. Em colisão de CPF
      // (`un_residente_cpf`), regera o lote inteiro com a sequência seguinte.
      for (let tentativa = 0; ; tentativa += 1) {
        const linhas = base.map((r) => ({ ...r, cpf: proximoCpf() }));
        const { error } = await gestor.from("residente").insert(linhas);
        if (!error) break;
        if (error.code !== "23505" || tentativa >= 8) exigir(error, `residentes ${casa.slug}`);
      }

      const { data: relidos, error: erroRelidos } = await gestor
        .from("residente")
        .select("id_residente, nome, status")
        .eq("id_ilpi", idCasa);
      exigir(erroRelidos, `residentes ${casa.slug} (leitura)`);
      residentes = relidos ?? [];
    }
    log(`casa "${casa.nome}": ${residentes.length} residentes`);

    // ---- vínculo do funcionário desta casa
    const funcionario = equipe[indice];
    if (funcionario) {
      const { data: vinculoExistente } = await gestor
        .from("vinculo_ilpi")
        .select("id_vinculo")
        .eq("id_ilpi", idCasa)
        .eq("cargo", "FUNCIONARIO");

      let idVinculo = vinculoExistente?.[0]?.id_vinculo;

      if (!idVinculo) {
        const { data: dadosUsuario } = await funcionario.cliente.auth.getUser();
        const { data, error } = await gestor
          .from("vinculo_ilpi")
          .insert({
            id_usuario: dadosUsuario.user.id,
            id_ilpi: idCasa,
            cargo: "FUNCIONARIO",
          })
          .select("id_vinculo")
          .single();
        exigir(error, `vínculo ${funcionario.email}`);
        idVinculo = data.id_vinculo;
      }
      funcionario.idVinculo = idVinculo;

      // ---- registros dos últimos sete dias (a checagem é por casa, não global)
      const comRegistro = residentes.length > 0
        ? (
            await gestor
              .from("registro_assistencial")
              .select("id_registro", { count: "exact", head: true })
              .in("id_residente", residentes.map((r) => r.id_residente))
          ).count ?? 0
        : 0;

      if (comRegistro === 0) {
        const agora = Date.now();
        const ativos = residentes.filter((r) => r.status === "ATIVO");
        const alvos = ativos.length > 0 ? ativos : residentes;
        const linhas = [];

        for (let i = 0; i < 12; i += 1) {
          const modelo = MODELOS_REGISTRO[i % MODELOS_REGISTRO.length];
          const quando = new Date(agora - Math.floor(i / 2) * 86400000);
          quando.setHours(i % 2 === 0 ? 8 : 15, i % 2 === 0 ? 20 : 40, 0, 0);
          if (quando.getTime() > agora - 3600000) quando.setDate(quando.getDate() - 1);

          // o registro 3 sai com 25 minutos de atraso, para a sinalização aparecer
          const atrasoSegundos = i === 3 ? 25 * 60 : 25 + i * 7;

          linhas.push({
            id_residente: alvos[i % alvos.length].id_residente,
            id_vinculo: idVinculo,
            tipo: modelo.tipo,
            titulo: modelo.titulo,
            descricao: modelo.descricao,
            criado_em_dispositivo: quando.toISOString(),
            sincronizado_em_servidor: new Date(
              quando.getTime() + atrasoSegundos * 1000,
            ).toISOString(),
          });
        }

        exigir(
          (await funcionario.cliente.from("registro_assistencial").insert(linhas)).error,
          `registros ${casa.slug}`,
        );
        log(`casa "${casa.nome}": ${linhas.length} registros nos últimos 7 dias`);
      } else {
        log(`casa "${casa.nome}": registros já existiam`);
      }
    }

    // ---- vínculo de família (familiar da primeira casa, outro da segunda)
    const familiar = familiares[indice];
    if (familiar && residentes.length > 0) {
      const alvo = residentes[0];
      const { count: vinculos } = await gestor
        .from("familiar_residente")
        .select("id_familiar_residente", { count: "exact", head: true })
        .eq("id_residente", alvo.id_residente);

      if (!vinculos) {
        // Quem cria o vínculo da família é a equipe (é o que a policy exige):
        // no fluxo real isso acontece ao aprovar a solicitação de entrada.
        const { data: dadosUsuario } = await familiar.cliente.auth.getUser();
        exigir(
          (
            await gestor.from("familiar_residente").insert({
              id_usuario: dadosUsuario.user.id,
              id_residente: alvo.id_residente,
              parentesco: indice === 0 ? "Filha" : "Sobrinho",
              responsavel_principal: true,
            })
          ).error,
          `familiar_residente ${casa.slug}`,
        );
        log(`casa "${casa.nome}": família de ${alvo.nome}`);
      }

      // ---- avaliação (uma por usuário por casa; só casa publicada aceita avaliação)
      const { count: avaliacoes } = await gestor
        .from("avaliacao")
        .select("id_avaliacao", { count: "exact", head: true })
        .eq("id_ilpi", idCasa);

      if (!avaliacoes && (casa.publicado ?? true)) {
        const { error } = await familiar.cliente.from("avaliacao").insert({
          id_usuario: (await familiar.cliente.auth.getUser()).data.user.id,
          id_ilpi: idCasa,
          nota: indice === 0 ? 5 : 4,
          comentario:
            indice === 0
              ? "Minha mãe está muito bem cuidada. A equipe avisa de tudo pelo aplicativo e recebe a família sem pressa."
              : "Ambiente tranquilo e equipe atenciosa. Só sentimos falta de mais atividades na parte da tarde.",
        });
        if (error && error.code !== "23505") exigir(error, `avaliacao ${casa.slug}`);
        else log(`casa "${casa.nome}": avaliação de ${familiar.nome}`);
      }
    }

    // ---- solicitação de entrada pendente (segunda casa) + uma já respondida
    const solicitante = familiares[indice === 0 ? 1 : 0];
    if (solicitante) {
      const { data: dadosUsuario } = await solicitante.cliente.auth.getUser();
      const { count: adesoes } = await gestor
        .from("adesao_ilpi")
        .select("id_adesao", { count: "exact", head: true })
        .eq("id_ilpi", idCasa)
        .eq("id_usuario", dadosUsuario.user.id);
      if (!adesoes) {
        const { error } = await solicitante.cliente.from("adesao_ilpi").insert({
          id_usuario: dadosUsuario.user.id,
          id_ilpi: idCasa,
          status: "PENDENTE",
        });
        if (error && error.code !== "23505") exigir(error, `adesao ${casa.slug}`);
        else log(`casa "${casa.nome}": solicitação pendente de ${solicitante.nome}`);
      }
    }
  }

  // uma solicitação já respondida, para a lista da casa não ficar só com pendentes
  const { count: respondidas } = await gestor
    .from("adesao_ilpi")
    .select("id_adesao", { count: "exact", head: true })
    .eq("id_ilpi", idsCasas[0])
    .neq("status", "PENDENTE");

  if (!respondidas) {
    const { data: dadosUsuario } = await equipe[1].cliente.auth.getUser();
    const { data: criada } = await equipe[1].cliente
      .from("adesao_ilpi")
      .insert({ id_usuario: dadosUsuario.user.id, id_ilpi: idsCasas[0], status: "PENDENTE" })
      .select("id_adesao")
      .maybeSingle();
    if (criada) {
      await gestor
        .from("adesao_ilpi")
        .update({ status: "APROVADA", data_resposta: new Date().toISOString() })
        .eq("id_adesao", criada.id_adesao);
      log(`casa "${CASAS[0].nome}": solicitação já respondida (aprovada)`);
    }
  }

  console.log("");
  console.log("Pronto. Entre com:");
  console.log(`  gestor    ${CONTAS.gestor.email}`);
  console.log(`  senha     (a que você passou em DEMO_PW)`);
  console.log("  painel    /gerente");
  console.log("");
  console.log("Para desfazer: rode supabase/demo-limpar.sql no SQL Editor do Supabase.");
}

main().catch((erro) => {
  console.error("");
  console.error("Falhou:", erro.message);
  process.exit(1);
});
