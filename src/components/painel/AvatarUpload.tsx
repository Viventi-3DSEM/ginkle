"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { atualizarAvatar } from "@/lib/painel/actions";
import { iniciais } from "@/lib/painel/formato";
import {
  ACCEPT_IMAGENS,
  enviarImagemStorage,
  LIMITE_AVATAR,
  validarImagem,
} from "@/lib/supabase/storage";

type Props = {
  usuarioId: string;
  nome: string;
  avatarUrl: string | null;
};

export default function AvatarUpload({ usuarioId, nome, avatarUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlAtual, setUrlAtual] = useState<string | null>(avatarUrl);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [atualizando, startTransition] = useTransition();

  const ocupado = enviando || atualizando;

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro("");
    setOk("");

    const erroVal = validarImagem(arquivo, LIMITE_AVATAR);
    if (erroVal) {
      setErro(erroVal);
      return;
    }

    setEnviando(true);
    const upload = await enviarImagemStorage("avatares", usuarioId, arquivo);
    setEnviando(false);

    if (upload.erro || !upload.url) {
      setErro(upload.erro ?? "Não foi possível enviar a foto.");
      return;
    }

    const novaUrl = upload.url;
    startTransition(async () => {
      const res = await atualizarAvatar(novaUrl);
      if (res.erro) {
        setErro(res.erro);
      } else {
        setUrlAtual(novaUrl);
        setOk(res.ok ?? "Foto atualizada.");
      }
    });
  }

  function aoRemover() {
    setErro("");
    setOk("");
    startTransition(async () => {
      const res = await atualizarAvatar(null);
      if (res.erro) {
        setErro(res.erro);
      } else {
        setUrlAtual(null);
        setOk(res.ok ?? "Foto removida.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-brand-soft">
          {urlAtual ? (
            <Image
              src={urlAtual}
              alt={`Foto de ${nome}`}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-full place-items-center font-heading text-base font-bold text-brand-strong"
            >
              {iniciais(nome)}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_IMAGENS}
              onChange={aoSelecionar}
              disabled={ocupado}
              className="sr-only"
              id="perfil-avatar-input"
            />
            <button
              type="button"
              disabled={ocupado}
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {ocupado ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="size-3.5 text-brand-strong" aria-hidden="true" />
              )}
              {enviando
                ? "Enviando..."
                : urlAtual
                  ? "Trocar foto"
                  : "Adicionar foto"}
            </button>

            {urlAtual ? (
              <button
                type="button"
                disabled={ocupado}
                onClick={aoRemover}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-60"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remover
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP ou AVIF até 2 MB.</p>
        </div>
      </div>

      {erro ? (
        <p
          role="alert"
          className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{erro}</span>
        </p>
      ) : null}

      {ok ? (
        <p
          role="status"
          className="flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-3 py-2 text-xs text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
          <span>{ok}</span>
        </p>
      ) : null}
    </div>
  );
}
