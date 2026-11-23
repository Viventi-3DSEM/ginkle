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

export async function salvarAvaliacao(
  _estado: EstadoAcao,
  form: FormData,
): Promise<EstadoAcao> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };

  const casaId = texto(form, "casaId");
  const avaliacaoId = texto(form, "avaliacaoId");
  const notaBruta = Number(texto(form, "nota"));
  const comentario = texto(form, "comentario");

  if (!UUID_RE.test(casaId)) return { erro: "Instituição inválida." };
  if (!Number.isInteger(notaBruta) || notaBruta < 1 || notaBruta > 5) {
    return { erro: "Escolha uma nota de 1 a 5 estrelas." };
  }
  if (comentario.length > 1000) {
    return { erro: "O comentário pode ter no máximo 1000 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data: casa } = await supabase
    .from("ilpi")
    .select("slug, publicado")
    .eq("id_ilpi", casaId)
    .maybeSingle();

  if (avaliacaoId && UUID_RE.test(avaliacaoId)) {
    const { error } = await supabase
      .from("avaliacao")
      .update({
        nota: notaBruta,
        comentario: comentario || null,
        data_avaliacao: new Date().toISOString(),
      })
      .eq("id_avaliacao", avaliacaoId)
      .eq("id_usuario", user.id);

    if (error) {
      if (error.code === "42501") {
        return { erro: "Você não tem permissão para editar esta avaliação." };
      }
      return { erro: "Não foi possível atualizar sua avaliação agora. Tente novamente." };
    }
  } else {
    if (!casa?.publicado) {
      return { erro: "Esta instituição ainda não está publicada no diretório para receber avaliações." };
    }

    const { error } = await supabase.from("avaliacao").insert({
      id_usuario: user.id,
      id_ilpi: casaId,
      nota: notaBruta,
      comentario: comentario || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { erro: "Você já avaliou esta instituição. Recarregue a página para editar sua avaliação." };
      }
      if (error.code === "42501") {
        return {
          erro: "Apenas familiares com residente vinculado em instituições publicadas podem avaliar.",
        };
      }
      return { erro: "Não foi possível enviar sua avaliação agora. Tente novamente." };
    }
  }

  revalidatePath("/cliente/avaliacoes");
  revalidatePath("/casas");
  if (casa?.slug) revalidatePath(`/casas/${casa.slug as string}`);
  revalidatePath("/gerente");
  revalidatePath(`/gerente/casas/${casaId}`);

  return {
    ok: avaliacaoId ? "Avaliação atualizada com sucesso." : "Avaliação publicada com sucesso.",
    id: casaId,
  };
}

export async function removerAvaliacao(
  avaliacaoId: string,
  casaId: string,
): Promise<EstadoAcao> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };
  if (!UUID_RE.test(avaliacaoId) || !UUID_RE.test(casaId)) {
    return { erro: "Avaliação não encontrada." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data: casa } = await supabase
    .from("ilpi")
    .select("slug")
    .eq("id_ilpi", casaId)
    .maybeSingle();

  const { error } = await supabase
    .from("avaliacao")
    .delete()
    .eq("id_avaliacao", avaliacaoId)
    .eq("id_usuario", user.id);

  if (error) {
    return { erro: "Não foi possível remover sua avaliação agora. Tente novamente." };
  }

  revalidatePath("/cliente/avaliacoes");
  revalidatePath("/casas");
  if (casa?.slug) revalidatePath(`/casas/${casa.slug as string}`);
  revalidatePath("/gerente");
  revalidatePath(`/gerente/casas/${casaId}`);

  return { ok: "Avaliação removida." };
}

export async function iniciarConversa(
  casaId: string,
): Promise<{ ok?: true; conversaId?: string; erro?: string }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };
  if (!UUID_RE.test(casaId)) return { erro: "Instituição inválida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { data: existente } = await supabase
    .from("conversa")
    .select("id_conversa")
    .eq("id_usuario", user.id)
    .eq("id_ilpi", casaId)
    .maybeSingle();

  if (existente?.id_conversa) {
    return { ok: true, conversaId: existente.id_conversa as string };
  }

  const { data: criada, error } = await supabase
    .from("conversa")
    .insert({ id_usuario: user.id, id_ilpi: casaId })
    .select("id_conversa")
    .maybeSingle();

  if (error || !criada) {
    if (error?.code === "23505") {
      const { data: relida } = await supabase
        .from("conversa")
        .select("id_conversa")
        .eq("id_usuario", user.id)
        .eq("id_ilpi", casaId)
        .maybeSingle();
      if (relida?.id_conversa) {
        return { ok: true, conversaId: relida.id_conversa as string };
      }
    }
    return { erro: "Não foi possível iniciar a conversa agora. Tente novamente." };
  }

  revalidatePath("/cliente/chat");
  revalidatePath("/funcionario/chat");
  return { ok: true, conversaId: criada.id_conversa as string };
}

export async function enviarMensagemFamiliar(
  conversaId: string,
  conteudoBruto: string,
): Promise<{ ok?: true; mensagemId?: string; dataHora?: string; erro?: string }> {
  if (!supabaseConfigurado()) return { erro: SEM_SUPABASE };
  if (!UUID_RE.test(conversaId)) return { erro: "Conversa inválida." };

  const conteudo = conteudoBruto.trim();
  if (conteudo.length === 0) return { erro: "Digite uma mensagem antes de enviar." };
  if (conteudo.length > 2000) {
    return { erro: "A mensagem pode ter no máximo 2000 caracteres." };
  }

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
      return { erro: "Você não tem permissão para enviar mensagens nesta conversa." };
    }
    return { erro: "Não foi possível enviar sua mensagem agora. Tente novamente." };
  }

  revalidatePath("/cliente/chat");
  revalidatePath("/funcionario/chat");
  return {
    ok: true,
    mensagemId: data.id_mensagem as string,
    dataHora: data.data_hora as string,
  };
}
