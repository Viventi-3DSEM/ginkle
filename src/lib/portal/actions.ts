"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";

export type EstadoAcao = { erro?: string; ok?: string; id?: string };

const SEM_SUPABASE =
  "O serviço de dados está indisponível no momento. Tente novamente em instantes.";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(form: FormData, campo: string): string {
  return String(form.get(campo) ?? "").trim();
}

export async function solicitarAdesao(
  _estado: EstadoAcao,
  form: FormData,
): Promise<EstadoAcao> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const casaId = texto(form, "casaId");
  if (!UUID_RE.test(casaId)) {
    return { erro: "Escolha uma instituição da lista para enviar a solicitação." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente para continuar." };

  // A policy adesao_solicita não checa `ilpi.publicado`; garantimos aqui que só
  // instituições publicadas no diretório recebam novos pedidos pelo portal.
  const { data: casa } = await supabase
    .from("ilpi_publica")
    .select("id_ilpi, nome")
    .eq("id_ilpi", casaId)
    .maybeSingle();

  if (!casa) {
    return {
      erro: "Esta instituição não está disponível para novas solicitações no diretório.",
    };
  }

  const nomeCasa = String(casa.nome ?? "a instituição");

  const { count: pendenteExistente } = await supabase
    .from("adesao_ilpi")
    .select("id_adesao", { count: "exact", head: true })
    .eq("id_usuario", user.id)
    .eq("id_ilpi", casaId)
    .eq("status", "PENDENTE");

  if ((pendenteExistente ?? 0) > 0) {
    return { erro: `Você já tem uma solicitação pendente para ${nomeCasa}.` };
  }

  const { error } = await supabase.from("adesao_ilpi").insert({
    id_usuario: user.id,
    id_ilpi: casaId,
    status: "PENDENTE",
  });

  if (error) {
    if (error.code === "23505") {
      return { erro: `Você já tem uma solicitação pendente para ${nomeCasa}.` };
    }
    if (error.code === "42501") {
      return { erro: "Você não tem permissão para enviar esta solicitação." };
    }
    if (error.code === "23503") {
      return { erro: "Instituição não encontrada." };
    }
    return { erro: "Não foi possível enviar a solicitação. Tente novamente." };
  }

  revalidatePath("/cliente");
  revalidatePath("/cliente/solicitacoes");
  revalidatePath("/gerente");
  revalidatePath("/gerente/residentes");
  revalidatePath(`/gerente/casas/${casaId}`);

  return {
    ok: `Solicitação enviada para ${nomeCasa}. A equipe da instituição analisará o pedido e fará o vínculo quando aprovar.`,
    id: casaId,
  };
}

export async function cancelarAdesao(
  _estado: EstadoAcao,
  form: FormData,
): Promise<EstadoAcao> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const id = texto(form, "id");
  if (!UUID_RE.test(id)) return { erro: "Solicitação não encontrada." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente para continuar." };

  // Filtra explicitamente por id_usuario e status PENDENTE (dupla trava com a
  // policy adesao_cancela_propria, inclusive caso o usuário também seja equipe).
  const { data, error } = await supabase
    .from("adesao_ilpi")
    .update({ status: "CANCELADA" })
    .eq("id_adesao", id)
    .eq("id_usuario", user.id)
    .eq("status", "PENDENTE")
    .select("id_adesao, id_ilpi");

  if (error) {
    if (error.code === "42501") {
      return { erro: "Você não tem permissão para cancelar esta solicitação." };
    }
    return { erro: "Não foi possível cancelar a solicitação. Tente novamente." };
  }

  const atualizada = (data ?? []) as unknown as { id_adesao: string; id_ilpi: string }[];
  if (atualizada.length === 0) {
    return { erro: "Esta solicitação não está mais pendente ou não foi encontrada." };
  }

  revalidatePath("/cliente");
  revalidatePath("/cliente/solicitacoes");
  revalidatePath("/gerente");
  revalidatePath("/gerente/residentes");
  revalidatePath(`/gerente/casas/${atualizada[0].id_ilpi}`);

  return {
    ok: "Solicitação cancelada. Você pode enviar um novo pedido para esta casa quando quiser.",
    id,
  };
}
