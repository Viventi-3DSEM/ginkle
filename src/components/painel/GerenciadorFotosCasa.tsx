"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
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

function CardFoto({
  foto,
  casaId,
  indice,
  total,
  onAviso,
  onErro,
}: {
  foto: FotoCasaItem;
  casaId: string;
  indice: number;
  total: number;
  onAviso: (msg: string) => void;
  onErro: (msg: string) => void;
}) {
  const [legenda, setLegenda] = useState(foto.legenda ?? "");
  const [pendente, startTransition] = useTransition();

  const legendaMudou = legenda.trim() !== (foto.legenda ?? "").trim();
  const ehCapa = indice === 0;

  function executar(fn: () => Promise<{ erro?: string; ok?: string }>) {
    onErro("");
    onAviso("");
    startTransition(async () => {
      const res = await fn();
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
            executar(() => atualizarLegendaFoto(foto.id, casaId, legenda));
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
            className="min-h-8 min-w-0 flex-1 border-b border-input bg-transparent py-1 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong"
          />
          {legendaMudou ? (
            <button
              type="submit"
              disabled={pendente}
              aria-label="Salvar legenda"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pendente ? (
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
                onClick={() => executar(() => definirCapaCasa(foto.id, casaId))}
                className="inline-flex min-h-8 items-center gap-1 rounded-sm border border-border px-2 py-1 text-[0.72rem] font-medium transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <Star className="size-3 text-brand-strong" aria-hidden="true" />
                Capa
              </button>
            ) : null}

            {total > 1 ? (
              <>
                <button
                  type="button"
                  disabled={pendente || indice === 0}
                  onClick={() => executar(() => reordenarFotoCasa(foto.id, casaId, "anterior"))}
                  aria-label="Mover foto para a esquerda"
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-35"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={pendente || indice === total - 1}
                  onClick={() => executar(() => reordenarFotoCasa(foto.id, casaId, "proxima"))}
                  aria-label="Mover foto para a direita"
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-35"
                >
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>

          <button
            type="button"
            disabled={pendente}
            onClick={() => executar(() => removerFotoCasa(foto.id, casaId))}
            aria-label={`Remover foto ${indice + 1}`}
            className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50"
          >
            {pendente ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function GerenciadorFotosCasa({ casaId, fotos, maxFotos = 12 }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [enviandoQtd, setEnviandoQtd] = useState(0);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const vagasRestantes = Math.max(0, maxFotos - fotos.length);

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
            capa na vitrine.
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
            />
          ))}
        </ul>
      )}
    </div>
  );
}
