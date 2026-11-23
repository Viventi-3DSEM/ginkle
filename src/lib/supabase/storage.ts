import { createClient } from "./client";

export type BucketImagem = "fotos-casas" | "avatares";

export const ACCEPT_IMAGENS = "image/jpeg,image/png,image/webp,image/avif";
export const LIMITE_FOTO_CASA = 5 * 1024 * 1024;
export const LIMITE_AVATAR = 2 * 1024 * 1024;

const EXT_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function validarImagem(arquivo: File, limiteBytes: number): string | null {
  if (!EXT_POR_MIME[arquivo.type]) {
    return "Use uma imagem JPG, PNG, WebP ou AVIF.";
  }
  if (arquivo.size > limiteBytes) {
    const mb = Math.round(limiteBytes / (1024 * 1024));
    return `A imagem ultrapassa o limite de ${mb} MB.`;
  }
  return null;
}

/**
 * Envia a imagem direto do navegador para o Supabase Storage (respeitando as
 * policies da 0013), evitando o limite de payload das Server Actions na Vercel.
 */
export async function enviarImagemStorage(
  bucket: BucketImagem,
  pastaId: string,
  arquivo: File,
): Promise<{ url?: string; erro?: string }> {
  const limite = bucket === "avatares" ? LIMITE_AVATAR : LIMITE_FOTO_CASA;
  const erroValidacao = validarImagem(arquivo, limite);
  if (erroValidacao) return { erro: erroValidacao };

  const ext = EXT_POR_MIME[arquivo.type];
  const caminho = `${pastaId}/${crypto.randomUUID()}.${ext}`;

  try {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
      contentType: arquivo.type,
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("row-level security") || m.includes("not allowed") || m.includes("403")) {
        return { erro: "Você não tem permissão para enviar esta imagem." };
      }
      if (m.includes("exceeded") || m.includes("payload") || m.includes("size")) {
        return { erro: "Imagem muito grande para envio." };
      }
      if (m.includes("mime")) {
        return { erro: "Formato de imagem não aceito. Use JPG, PNG, WebP ou AVIF." };
      }
      return { erro: "Não foi possível enviar a imagem. Tente novamente." };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);
    return { url: data.publicUrl };
  } catch {
    return { erro: "Falha de conexão ao enviar a imagem." };
  }
}
