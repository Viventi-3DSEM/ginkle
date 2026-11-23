"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  atualizarLegendaFoto,
  definirCapaCasa,
  registrarFotosCasa,
  removerFotoCasa,
  reordenarFotoCasa,
} from "@/lib/painel/actions";
import {
  ACCEPT_IMAGENS,
  enviarImagemStorage,
  LIMITE_FOTO_CASA,
  validarImagem,
} from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

export type FotoCasaItem = {
  id: string;
  url: string;
  legenda: string | null;
};

type Props = {
  casaId: string;
  fotos: FotoCasaItem[];
  maxFotos?: number;
};

type AcaoCard = "legenda" | "capa" | "anterior" | "proxima" | null;

function CardFoto({
  foto,
  casaId,
  indice,
  total,
  onAviso,
  onErro,
  onPedirRemocao,
}: {
  foto: FotoCasaItem;
  casaId: string;
  indice: number;
  total: number;
  onAviso: (msg: string) => void;
  onErro: (msg: string) => void;
  onPedirRemocao: (foto: FotoCasaItem, indice: number) => void;
}) {
  const [legenda, setLegenda] = useState(foto.legenda ?? "");
  const [ultimaPropLegenda, setUltimaPropLegenda] = useState(foto.legenda ?? "");
  const [acaoAtiva, setAcaoAtiva] = useState<AcaoCard>(null);
  const [pendente, startTransition] = useTransition();

  if ((foto.legenda ?? "") !== ultimaPropLegenda) {
    const nova = foto.legenda ?? "";
    setUltimaPropLegenda(nova);
    setLegenda(nova);
  }

  const legendaMudou = legenda.trim() !== (foto.legenda ?? "").trim();
  const ehCapa = indice === 0;

  function executar(acao: Exclude<AcaoCard, null>, fn: () => Promise<{ erro?: string; ok?: string }>) {
    onErro("");
    onAviso("");
    setAcaoAtiva(acao);
    startTransition(async () => {
      const res = await fn();
      setAcaoAtiva(null);
      if (res.erro) onErro(res.erro);
      else if (res.ok) onAviso(res.ok);
    });
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-sm border border-border bg-background/60">
      <div className="relative aspect-[4/3] w-full bg-secondary">
        <Image
          src={foto.url}
          alt={foto.legenda ?? `Foto ${indice + 1} da casa`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          className="object-cover"
        />
        {ehCapa ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
            <Star className="size-3 fill-current" aria-hidden="true" />
            Capa
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!legendaMudou || pendente) return;
            executar("legenda", () => atualizarLegendaFoto(foto.id, casaId, legenda));
          }}
          className="flex items-center gap-1.5"
        >
          <label htmlFor={`legenda-${foto.id}`} className="sr-only">
            Legenda da foto {indice + 1}
          </label>
          <input
            id={`legenda-${foto.id}`}
            type="text"
            maxLength={160}
            value={legenda}
            disabled={pendente}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="Legenda opcional (ex.: Jardim)"
            className="min-h-8 min-w-0 flex-1 border-b border-input bg-transparent py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-xs"
          />
          {legendaMudou ? (
            <button
              type="submit"
              disabled={pendente}
              aria-label="Salvar legenda"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {acaoAtiva === "legenda" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-3.5" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </form>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-1">
          <div className="flex items-center gap-1">
            {!ehCapa ? (
              <button
                type="button"
                disabled={pendente}
                onClick={() => executar("capa", () => definirCapaCasa(foto.id, casaId))}
                className="inline-flex min-h-8 items-center gap-1 rounded-sm border border-border px-2 py-1 text-[0.72rem] font-medium transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {acaoAtiva === "capa" ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Star className="size-3 text-brand-strong" aria-hidden="true" />
                )}
                Capa
              </button>
            ) : null}

            {total > 1 ? (
              <>
                <button
                  type="button"
                  disabled={pendente || indice === 0}
                  onClick={() =>
                    executar("anterior", () => reordenarFotoCasa(foto.id, casaId, "anterior"))
                  }
                  aria-label="Mover foto para antes"
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-35"
                >
                  {acaoAtiva === "anterior" ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={pendente || indice === total - 1}
                  onClick={() =>
                    executar("proxima", () => reordenarFotoCasa(foto.id, casaId, "proxima"))
                  }
                  aria-label="Mover foto para depois"
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-35"
                >
                  {acaoAtiva === "proxima" ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              </>
            ) : null}
          </div>

          <button
            type="button"
            disabled={pendente}
            onClick={() => onPedirRemocao(foto, indice)}
            aria-label={`Remover foto ${indice + 1}`}
            className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function GerenciadorFotosCasa({ casaId, fotos, maxFotos = 12 }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarBtnRef = useRef<HTMLButtonElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [enviandoQtd, setEnviandoQtd] = useState(0);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [alvoRemover, setAlvoRemover] = useState<{ foto: FotoCasaItem; indice: number } | null>(
    null,
  );
  const [erroDialogo, setErroDialogo] = useState("");
  const [removendo, startRemocao] = useTransition();

  const tituloDialogId = useId();
  const descDialogId = useId();

  const removendoRef = useRef(removendo);
  useEffect(() => {
    removendoRef.current = removendo;
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.setAttribute("closedby", removendo ? "none" : "any");
    }
  }, [removendo]);

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
      if (!removendoRef.current && pressionouFora && fora(e)) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  const vagasRestantes = Math.max(0, maxFotos - fotos.length);

  function abrirRemocao(foto: FotoCasaItem, indice: number) {
    setErro("");
    setAviso("");
    setErroDialogo("");
    setAlvoRemover({ foto, indice });
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarBtnRef.current?.focus();
    }
  }

  function confirmarRemocao() {
    if (!alvoRemover) return;
    const fotoId = alvoRemover.foto.id;
    setErroDialogo("");
    startRemocao(async () => {
      const res = await removerFotoCasa(fotoId, casaId);
      if (res.erro) {
        setErroDialogo(res.erro);
      } else {
        setAviso(res.ok ?? "Foto removida.");
        dialogRef.current?.close("confirmed");
      }
    });
  }

  async function processarArquivos(lista: FileList | File[]) {
    const arquivos = Array.from(lista);
    if (arquivos.length === 0) return;

    setErro("");
    setAviso("");

    if (vagasRestantes === 0) {
      setErro(`Limite de ${maxFotos} fotos por casa atingido. Remova alguma para adicionar novas.`);
      return;
    }

    const selecionados = arquivos.slice(0, vagasRestantes);
    const errosValidacao: string[] = [];
    const validos: File[] = [];

    for (const arq of selecionados) {
      const msg = validarImagem(arq, LIMITE_FOTO_CASA);
      if (msg) errosValidacao.push(`${arq.name}: ${msg}`);
      else validos.push(arq);
    }

    if (validos.length === 0) {
      setErro(errosValidacao[0] ?? "Selecione imagens JPG, PNG, WebP ou AVIF de até 5 MB.");
      return;
    }

    setEnviandoQtd(validos.length);
    const enviadas: { url: string }[] = [];
    const falhasUpload: string[] = [];

    for (const arq of validos) {
      const res = await enviarImagemStorage("fotos-casas", casaId, arq);
      if (res.url) enviadas.push({ url: res.url });
      else falhasUpload.push(`${arq.name}: ${res.erro ?? "erro no envio"}`);
    }

    if (enviadas.length > 0) {
      const reg = await registrarFotosCasa(casaId, enviadas);
      if (reg.erro) {
        setErro(reg.erro);
      } else {
        setAviso(reg.ok ?? "Fotos adicionadas.");
        router.refresh();
      }
    }

    const todosErros = [...errosValidacao, ...falhasUpload];
    if (todosErros.length > 0) {
      setErro(todosErros[0]);
    } else if (arquivos.length > vagasRestantes) {
      setErro(`Apenas ${vagasRestantes} foto(s) foram enviadas pelo limite de ${maxFotos} fotos.`);
    }

    setEnviandoQtd(0);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (vagasRestantes > 0 && enviandoQtd === 0) setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          if (vagasRestantes > 0 && enviandoQtd === 0 && e.dataTransfer.files.length > 0) {
            void processarArquivos(e.dataTransfer.files);
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed p-5 text-center transition-colors sm:flex-row sm:justify-between sm:text-left",
          arrastando ? "border-brand-strong bg-secondary/60" : "border-border bg-background/40",
        )}
      >
        <div>
          <p className="text-sm font-medium text-foreground">
            {vagasRestantes > 0
              ? "Adicione fotos da fachada, quartos e áreas comuns"
              : `Limite de ${maxFotos} fotos atingido`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            JPG, PNG, WebP ou AVIF até 5 MB cada ({fotos.length}/{maxFotos}). A primeira foto é a
            capa no diretório público.
          </p>
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_IMAGENS}
            multiple
            disabled={enviandoQtd > 0 || vagasRestantes === 0}
            onChange={(e) => {
              if (e.target.files) void processarArquivos(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
            id={`upload-fotos-${casaId}`}
          />
          <button
            type="button"
            disabled={enviandoQtd > 0 || vagasRestantes === 0}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {enviandoQtd > 0 ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-4" aria-hidden="true" />
            )}
            {enviandoQtd > 0
              ? `Enviando ${enviandoQtd} ${enviandoQtd === 1 ? "foto" : "fotos"}...`
              : "Adicionar fotos"}
          </button>
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

      {aviso ? (
        <p
          role="status"
          className="flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-3 py-2 text-xs text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
          <span>{aviso}</span>
        </p>
      ) : null}

      {fotos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma foto adicionada ainda. Sem fotos próprias, a casa usa uma imagem padrão.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto, indice) => (
            <CardFoto
              key={foto.id}
              foto={foto}
              casaId={casaId}
              indice={indice}
              total={fotos.length}
              onAviso={setAviso}
              onErro={setErro}
              onPedirRemocao={abrirRemocao}
            />
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloDialogId}
        aria-describedby={descDialogId}
        onCancel={(e) => {
          if (removendo) e.preventDefault();
        }}
        onClose={(e) => {
          e.currentTarget.returnValue = "";
          setAlvoRemover(null);
          setErroDialogo("");
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-0 text-foreground shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={tituloDialogId} className="font-heading text-lg font-semibold">
              Remover foto?
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              disabled={removendo}
              aria-label="Fechar janela"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p id={descDialogId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A foto {alvoRemover ? alvoRemover.indice + 1 : ""}
            {alvoRemover?.foto.legenda ? ` (“${alvoRemover.foto.legenda}”)` : ""} será removida
            permanentemente da galeria da casa.
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
              disabled={removendo}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarRemocao}
              disabled={removendo || !alvoRemover}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {removendo ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {removendo ? "Removendo..." : "Remover foto"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
