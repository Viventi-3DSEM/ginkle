"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
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
