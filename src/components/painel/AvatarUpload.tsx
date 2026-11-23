"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2, Trash2, X } from "lucide-react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarBtnRef = useRef<HTMLButtonElement>(null);
  const [urlAtual, setUrlAtual] = useState<string | null>(avatarUrl);
  const [ultimoPropUrl, setUltimoPropUrl] = useState<string | null>(avatarUrl);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [erroDialogo, setErroDialogo] = useState("");
  const [ok, setOk] = useState("");
  const [atualizando, startTransition] = useTransition();

  const tituloDialogId = useId();
  const descDialogId = useId();

  if (avatarUrl !== ultimoPropUrl) {
    setUltimoPropUrl(avatarUrl);
    setUrlAtual(avatarUrl);
  }

  const ocupado = enviando || atualizando;
  const ocupadoRef = useRef(ocupado);
  useEffect(() => {
    ocupadoRef.current = ocupado;
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.setAttribute("closedby", ocupado ? "none" : "any");
    }
  }, [ocupado]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.setAttribute("closedby", "any");
    if ("closedBy" in HTMLDialogElement.prototype) return;

    const fora = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    let pressionouFora = false;
    const onDown = (e: PointerEvent) => {
      pressionouFora = fora(e);
    };
    const onUp = (e: PointerEvent) => {
      if (!ocupadoRef.current && pressionouFora && fora(e)) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

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

  function abrirRemocao() {
    setErro("");
    setErroDialogo("");
    setOk("");
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarBtnRef.current?.focus();
    }
  }

  function confirmarRemocao() {
    setErroDialogo("");
    startTransition(async () => {
      const res = await atualizarAvatar(null);
      if (res.erro) {
        setErroDialogo(res.erro);
      } else {
        setUrlAtual(null);
        setOk(res.ok ?? "Foto removida.");
        dialogRef.current?.close("confirmed");
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
                onClick={abrirRemocao}
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

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloDialogId}
        aria-describedby={descDialogId}
        onCancel={(e) => {
          if (ocupado) e.preventDefault();
        }}
        onClose={(e) => {
          e.currentTarget.returnValue = "";
          setErroDialogo("");
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={tituloDialogId} className="font-heading text-lg font-semibold">
              Remover foto de perfil?
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={ocupado}
              aria-label="Fechar janela"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p id={descDialogId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sua foto será removida do perfil e substituída pelas iniciais do seu nome.
          </p>

          {erroDialogo ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 border-l-2 border-danger bg-background/60 px-3 py-2.5 text-xs leading-relaxed text-danger"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{erroDialogo}</span>
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelarBtnRef}
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={ocupado}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarRemocao}
              disabled={ocupado}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {atualizando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {atualizando ? "Removendo..." : "Remover foto"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
