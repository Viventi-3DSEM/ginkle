"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import {
  algumTermoInadequado,
  contemTermoInadequado,
  MENSAGEM_MODERACAO,
} from "@/lib/validacao/moderacao";
import type { TipoRegistro } from "./dados";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIPOS_VALIDOS = new Set<TipoRegistro>([
  "CUIDADO",
  "MEDICAMENTO",
  "SINAL_VITAL",
  "OCORRENCIA",
]);

export type EntradaRegistroAssistencial = {
  idRegistro: string;
  idResidente: string;
  tipo: TipoRegistro;
  titulo: string;
  descricao: string;
  criadoEmDispositivo: string;
};

export type ResultadoRegistroAssistencial = {
  ok?: true;
  jaSincronizado?: boolean;
  erro?: string;
  /** Erro definitivo (validação/permissão): não adianta reenviar automaticamente na fila. */
  permanente?: boolean;
};

/**
 * Grava um registro assistencial de forma idempotente pelo UUID gerado no dispositivo.
 * Não informa `sincronizado_em_servidor`: o banco força `now()` via trigger (0014),
 * preservando o duplo timestamp antifraude entre dispositivo e servidor.
 */
export async function registrarCuidado(
  entrada: EntradaRegistroAssistencial,
): Promise<ResultadoRegistroAssistencial> {
  if (!supabaseConfigurado()) {
    return { erro: "O servidor não está disponível no momento." };
  }

  const idRegistro = String(entrada.idRegistro ?? "").trim();
  const idResidente = String(entrada.idResidente ?? "").trim();
  const tipo = String(entrada.tipo ?? "").trim() as TipoRegistro;
  const titulo = String(entrada.titulo ?? "").trim();
  const descricao = String(entrada.descricao ?? "").trim();
  const criadoEmDispositivo = String(entrada.criadoEmDispositivo ?? "").trim();

  if (!UUID_RE.test(idRegistro)) {
    return { erro: "Identificador do registro inválido.", permanente: true };
  }
  if (!UUID_RE.test(idResidente)) {
    return { erro: "Selecione um residente válido.", permanente: true };
  }
  if (!TIPOS_VALIDOS.has(tipo)) {
    return { erro: "Tipo de registro inválido.", permanente: true };
  }
  if (titulo.length < 3 || titulo.length > 100) {
    return { erro: "O título precisa ter entre 3 e 100 caracteres.", permanente: true };
  }
  if (descricao.length < 3 || descricao.length > 2000) {
    return { erro: "A descrição precisa ter entre 3 e 2000 caracteres.", permanente: true };
  }
  if (algumTermoInadequado(titulo, descricao)) {
    return { erro: MENSAGEM_MODERACAO, permanente: true };
  }

  const dataDispositivo = new Date(criadoEmDispositivo);
  if (Number.isNaN(dataDispositivo.getTime())) {
    return { erro: "Horário do registro inválido.", permanente: true };
  }
  const agoraMs = Date.now();
  const cincoMinMs = 5 * 60_000;
  const trintaDiasMs = 30 * 86_400_000;
  if (dataDispositivo.getTime() > agoraMs + cincoMinMs) {
    return { erro: "O horário do registro não pode estar no futuro.", permanente: true };
  }
  if (dataDispositivo.getTime() < agoraMs - trintaDiasMs) {
    return {
      erro: "Não é possível sincronizar registros com mais de 30 dias.",
      permanente: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sua sessão expirou. Entre novamente para sincronizar." };
  }

  // Descobre a casa do residente e o vínculo ativo do usuário nela no servidor.
  const { data: residente, error: erroRes } = await supabase
    .from("residente")
    .select("id_ilpi")
    .eq("id_residente", idResidente)
    .maybeSingle();

  if (erroRes) {
    return { erro: "Não foi possível consultar o residente agora. Tente novamente." };
  }
  if (!residente) {
    return {
      erro: "Residente não encontrado ou sem permissão de acesso.",
      permanente: true,
    };
  }

  const { data: vinculo, error: erroVinc } = await supabase
    .from("vinculo_ilpi")
    .select("id_vinculo")
    .eq("id_usuario", user.id)
    .eq("id_ilpi", residente.id_ilpi as string)
    .eq("ativo", true)
    .maybeSingle();

  if (erroVinc) {
    return { erro: "Não foi possível confirmar seu vínculo agora. Tente novamente." };
  }
  if (!vinculo) {
    return {
      erro: "Seu vínculo com esta casa não está ativo.",
      permanente: true,
    };
  }

  // Inserção sem `.select()` (evita RETURNING extra) e sem `sincronizado_em_servidor` (0014).
  const { error } = await supabase.from("registro_assistencial").insert({
    id_registro: idRegistro,
    id_residente: idResidente,
    id_vinculo: vinculo.id_vinculo as string,
    tipo,
    titulo,
    descricao,
    criado_em_dispositivo: dataDispositivo.toISOString(),
  });

  if (error) {
    // 23505 = UUID já gravado em uma tentativa anterior que perdeu o retorno na rede.
    if (error.code === "23505") {
      revalidatePath("/funcionario");
      revalidatePath("/funcionario/historico");
      revalidatePath(`/funcionario/residentes/${idResidente}`);
      return { ok: true, jaSincronizado: true };
    }
    if (error.code === "42501") {
      return {
        erro: "Você não tem permissão para registrar cuidados para este residente.",
        permanente: true,
      };
    }
    if (error.code === "23514" || error.code === "22P02") {
      return { erro: "Confira os dados informados antes de tentar novamente.", permanente: true };
    }
    return { erro: "Falha ao gravar no servidor. O registro continua salvo no aparelho." };
  }

  revalidatePath("/funcionario");
  revalidatePath("/funcionario/residentes");
  revalidatePath(`/funcionario/residentes/${idResidente}`);
  revalidatePath("/funcionario/historico");
  revalidatePath("/gerente");
  revalidatePath("/gerente/auditoria");
  revalidatePath("/cliente");
  revalidatePath(`/cliente/residentes/${idResidente}`);

  return { ok: true };
}

export async function responderSolicitacaoEquipe(entrada: {
  idAdesao: string;
  decisao: "APROVADA" | "RECUSADA";
  residenteId?: string;
  parentesco?: string;
  responsavelPrincipal?: boolean;
}): Promise<{ ok?: string; erro?: string }> {
  if (!supabaseConfigurado()) return { erro: "O servidor não está disponível no momento." };

  const idAdesao = String(entrada.idAdesao ?? "").trim();
  const decisao = entrada.decisao;
  if (!UUID_RE.test(idAdesao)) return { erro: "Solicitação não encontrada." };
  if (decisao !== "APROVADA" && decisao !== "RECUSADA") return { erro: "Decisão inválida." };

  const residenteId = String(entrada.residenteId ?? "").trim();
  const parentesco = String(entrada.parentesco ?? "").trim();

  if (decisao === "APROVADA" && residenteId) {
    if (!UUID_RE.test(residenteId)) return { erro: "Residente inválido para vínculo." };
    if (parentesco.length < 2 || parentesco.length > 60) {
      return { erro: "Informe o parentesco (entre 2 e 60 caracteres) para vincular ao residente." };
    }
    if (contemTermoInadequado(parentesco)) {
      return { erro: MENSAGEM_MODERACAO };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data: adesao } = await supabase
    .from("adesao_ilpi")
    .select("id_adesao, id_ilpi, id_usuario, status")
    .eq("id_adesao", idAdesao)
    .maybeSingle();

  if (!adesao) return { erro: "Solicitação não encontrada ou sem permissão." };
  if (adesao.status !== "PENDENTE") {
    return { erro: "Esta solicitação já foi respondida anteriormente." };
  }

  const { error: erroUpd } = await supabase
    .from("adesao_ilpi")
    .update({
      status: decisao,
      data_resposta: new Date().toISOString(),
    })
    .eq("id_adesao", idAdesao)
    .eq("status", "PENDENTE");

  if (erroUpd) {
    if (erroUpd.code === "42501") {
      return { erro: "Você não tem permissão para responder solicitações desta casa." };
    }
    return { erro: "Não foi possível atualizar a solicitação agora." };
  }

  let vinculou = false;
  if (decisao === "APROVADA" && residenteId) {
    const { error: erroVinc } = await supabase.from("familiar_residente").upsert(
      {
        id_usuario: adesao.id_usuario as string,
        id_residente: residenteId,
        parentesco,
        responsavel_principal: Boolean(entrada.responsavelPrincipal),
      },
      { onConflict: "id_usuario,id_residente" },
    );

    if (!erroVinc) vinculou = true;
  }

  revalidatePath("/funcionario");
  revalidatePath("/funcionario/aprovacoes");
  revalidatePath("/funcionario/residentes");
  revalidatePath("/gerente");
  revalidatePath("/gerente/residentes");
  revalidatePath(`/gerente/casas/${adesao.id_ilpi as string}`);
  revalidatePath("/cliente");
  revalidatePath("/cliente/solicitacoes");
  revalidatePath("/cliente/residentes");

  if (decisao === "RECUSADA") return { ok: "Solicitação recusada." };
  return {
    ok: vinculou
      ? "Solicitação aprovada e familiar vinculado ao residente."
      : "Solicitação aprovada. O vínculo com o residente pode ser feito na aba Residentes.",
  };
}

export async function iniciarConversaEquipe(
  casaId: string,
  familiarId: string,
): Promise<{ ok?: true; conversaId?: string; erro?: string }> {
  if (!supabaseConfigurado()) return { erro: "O servidor não está disponível no momento." };
  if (!UUID_RE.test(casaId) || !UUID_RE.test(familiarId)) {
    return { erro: "Dados inválidos para iniciar a conversa." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data: existente } = await supabase
    .from("conversa")
    .select("id_conversa")
    .eq("id_ilpi", casaId)
    .eq("id_usuario", familiarId)
    .maybeSingle();

  if (existente?.id_conversa) {
    return { ok: true, conversaId: existente.id_conversa as string };
  }

  const { data: criada, error } = await supabase
    .from("conversa")
    .insert({ id_ilpi: casaId, id_usuario: familiarId })
    .select("id_conversa")
    .maybeSingle();

  if (error || !criada) {
    if (error?.code === "42501") {
      return {
        erro: "Para a equipe iniciar novas conversas, aplique a migration 0015 no Supabase (familiares já podem iniciar normalmente).",
      };
    }
    return { erro: "Não foi possível abrir a conversa agora." };
  }

  revalidatePath("/funcionario/chat");
  revalidatePath("/cliente/chat");
  return { ok: true, conversaId: criada.id_conversa as string };
}

export async function enviarMensagemEquipe(
  conversaId: string,
  conteudoBruto: string,
): Promise<{ ok?: true; mensagemId?: string; dataHora?: string; erro?: string }> {
  if (!supabaseConfigurado()) return { erro: "O servidor não está disponível no momento." };
  if (!UUID_RE.test(conversaId)) return { erro: "Conversa inválida." };

  const conteudo = conteudoBruto.trim();
  if (conteudo.length === 0) return { erro: "Digite uma mensagem antes de enviar." };
  if (conteudo.length > 2000) return { erro: "A mensagem pode ter no máximo 2000 caracteres." };
  if (contemTermoInadequado(conteudo)) return { erro: MENSAGEM_MODERACAO };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data, error } = await supabase
    .from("mensagem")
    .insert({
      id_conversa: conversaId,
      id_usuario: user.id,
      conteudo,
    })
    .select("id_mensagem, data_hora")
    .maybeSingle();

  if (error || !data) {
    if (error?.code === "42501") {
      return { erro: "Você não tem permissão para responder esta conversa." };
    }
    return { erro: "Não foi possível enviar a mensagem agora." };
  }

  revalidatePath("/funcionario/chat");
  revalidatePath("/cliente/chat");
  return {
    ok: true,
    mensagemId: data.id_mensagem as string,
    dataHora: data.data_hora as string,
  };
}
