"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { registrarFotosCasa, type Estado } from "@/lib/painel/actions";
import {
  ACCEPT_IMAGENS,
  enviarImagemStorage,
  LIMITE_FOTO_CASA,
  validarImagem,
} from "@/lib/supabase/storage";
import { formatarCnpj } from "@/lib/validacao/cnpj";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { slugificar } from "@/lib/validacao/slug";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full border-b border-input bg-transparent py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export type ValoresCasa = {
  nome: string;
  slug: string;
  cnpj: string;
  telefone: string;
  email: string;
  site: string;
  endereco: string;
  cidade: string;
  bairro: string;
  uf: string;
  vagas: string;
  destaque: string;
  tags: string;
  descricao: string;
};

const VAZIO: ValoresCasa = {
  nome: "",
  slug: "",
  cnpj: "",
  telefone: "",
  email: "",
  site: "",
  endereco: "",
  cidade: "",
  bairro: "",
  uf: "SP",
  vagas: "0",
  destaque: "",
  tags: "",
  descricao: "",
};

function Campo({
  id,
  rotulo,
  dica,
  className,
  ...props
}: { id: string; rotulo: string; dica?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {rotulo}
      </label>
      <input id={id} name={id} className={inputClass} {...props} />
      {dica ? <p className="mt-1.5 text-xs text-muted-foreground">{dica}</p> : null}
    </div>
  );
}

type Props = {
  acao: (estado: Estado, form: FormData) => Promise<Estado>;
  titulo: string;
  subtitulo?: string;
  rotulo: string;
  voltarPara: string;
  idCasa?: string;
  valores?: ValoresCasa;
};

type FotoNaFila = {
  id: string;
  arquivo: File;
  preview: string;
  legenda: string;
};

const MAX_FOTOS_CADASTRO = 6;

export default function CasaForm({
  acao,
  titulo,
  subtitulo,
  rotulo,
  voltarPara,
  idCasa,
  valores,
}: Props) {
  const router = useRouter();
  const inicial = valores ?? VAZIO;
  const inputFotosRef = useRef<HTMLInputElement>(null);

  const [campos, setCampos] = useState<ValoresCasa>(inicial);
  const [slugTravado, setSlugTravado] = useState(Boolean(inicial.slug));
  const [fotosFila, setFotosFila] = useState<FotoNaFila[]>([]);
  const [erroFoto, setErroFoto] = useState("");
  const [enviandoFotos, setEnviandoFotos] = useState(false);

  function atualizarCampo<K extends keyof ValoresCasa>(campo: K, valor: ValoresCasa[K]) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }

  const fotosFilaRef = useRef<FotoNaFila[]>([]);
  useEffect(() => {
    fotosFilaRef.current = fotosFila;
  }, [fotosFila]);

  useEffect(() => {
    return () => {
      for (const f of fotosFilaRef.current) {
        URL.revokeObjectURL(f.preview);
      }
    };
  }, []);

  const [estado, enviar, enviando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await acao(prev, formData);
      if (res.casaId) {
        const filaAtual = fotosFilaRef.current;
        let falhasFotos = 0;
        if (filaAtual.length > 0) {
          setEnviandoFotos(true);
          const enviadas: { url: string; legenda?: string | null }[] = [];
          for (const item of filaAtual) {
            const up = await enviarImagemStorage("fotos-casas", res.casaId, item.arquivo);
            if (up.url) {
              enviadas.push({ url: up.url, legenda: item.legenda || null });
            } else {
              falhasFotos += 1;
            }
          }
          if (enviadas.length > 0) {
            const reg = await registrarFotosCasa(res.casaId, enviadas);
            if (reg.erro) {
              falhasFotos += enviadas.length;
            }
          }
          setEnviandoFotos(false);
        }
        const destino =
          falhasFotos > 0
            ? `/gerente/casas/${res.casaId}?fotosErro=${falhasFotos}`
            : `/gerente/casas/${res.casaId}`;
        router.push(destino);
      }
      return res;
    },
    {},
  );

  function adicionarFotosFila(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    setErroFoto("");
    const vagas = Math.max(0, MAX_FOTOS_CADASTRO - fotosFila.length);
    if (vagas === 0) {
      setErroFoto(`Você pode selecionar até ${MAX_FOTOS_CADASTRO} fotos no cadastro.`);
      return;
    }

    const selecionados = Array.from(lista).slice(0, vagas);
    const novas: FotoNaFila[] = [];
    for (const arquivo of selecionados) {
      const erroVal = validarImagem(arquivo, LIMITE_FOTO_CASA);
      if (erroVal) {
        setErroFoto(`${arquivo.name}: ${erroVal}`);
        continue;
      }
      novas.push({
        id: crypto.randomUUID(),
        arquivo,
        preview: URL.createObjectURL(arquivo),
        legenda: "",
      });
    }
    if (novas.length > 0) {
      setFotosFila((atual) => [...atual, ...novas]);
    }
  }

  function removerFotoFila(id: string) {
    setFotosFila((atual) => {
      const alvo = atual.find((f) => f.id === id);
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return atual.filter((f) => f.id !== id);
    });
  }

  function definirCapaFila(id: string) {
    setFotosFila((atual) => {
      const alvo = atual.find((f) => f.id === id);
      if (!alvo) return atual;
      return [alvo, ...atual.filter((f) => f.id !== id)];
    });
  }

  const slugAtual = slugTravado ? campos.slug : slugificar(campos.nome);
  const slugPreview = slugificar(slugAtual);
  const ocupado = enviando || enviandoFotos;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={voltarPara}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Voltar
      </Link>

      <h1 className="mt-3 font-heading text-2xl font-semibold sm:text-3xl">{titulo}</h1>
      {subtitulo ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitulo}</p>
      ) : null}

      <form action={enviar} className="mt-8 space-y-8" noValidate>
        {idCasa ? <input type="hidden" name="id" value={idCasa} /> : null}
        {!idCasa && fotosFila.length > 0 ? (
          <input type="hidden" name="retornarId" value="1" />
        ) : null}
        <input type="hidden" name="cnpjAtual" value={inicial.cnpj.replace(/\D/g, "")} />

        <section className="rounded-sm border border-border bg-card p-5 sm:p-7">
          <h2 className="font-heading text-lg font-semibold">Identificação</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Campo
              id="nome"
              rotulo="Nome da instituição"
              className="sm:col-span-2"
              placeholder="ILPI Vida Plena"
              value={campos.nome}
              onChange={(e) => atualizarCampo("nome", e.target.value)}
            />

            <Campo
              id="slug"
              rotulo="Link da página"
              placeholder="vida-plena"
              value={slugAtual}
              onChange={(e) => {
                const v = e.target.value;
                setSlugTravado(v.trim().length > 0);
                atualizarCampo("slug", v);
              }}
              dica={`ginkle.me/casas/${slugPreview || "sua-casa"}`}
            />

            <div>
              <label htmlFor="cnpj" className={labelClass}>
                CNPJ
              </label>
              <input
                id="cnpj"
                name="cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                value={campos.cnpj}
                onChange={(e) => atualizarCampo("cnpj", formatarCnpj(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="telefone" className={labelClass}>
                Telefone
              </label>
              <input
                id="telefone"
                name="telefone"
                inputMode="tel"
                placeholder="(13) 3474-1010"
                maxLength={15}
                value={campos.telefone}
                onChange={(e) => atualizarCampo("telefone", formatarTelefone(e.target.value))}
                className={inputClass}
              />
            </div>

            <Campo
              id="email"
              rotulo="E-mail de contato"
              type="email"
              placeholder="contato@suacasa.com.br"
              value={campos.email}
              onChange={(e) => atualizarCampo("email", e.target.value)}
            />

            <Campo
              id="site"
              rotulo="Site (opcional)"
              placeholder="suacasa.com.br"
              value={campos.site}
              onChange={(e) => atualizarCampo("site", e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 sm:p-7">
          <h2 className="font-heading text-lg font-semibold">Endereço</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-6">
            <Campo
              id="endereco"
              rotulo="Logradouro e número"
              className="sm:col-span-6"
              placeholder="Av. Presidente Costa e Silva, 1200"
              value={campos.endereco}
              onChange={(e) => atualizarCampo("endereco", e.target.value)}
            />
            <Campo
              id="cidade"
              rotulo="Cidade"
              className="sm:col-span-3"
              placeholder="Praia Grande"
              value={campos.cidade}
              onChange={(e) => atualizarCampo("cidade", e.target.value)}
            />
            <Campo
              id="bairro"
              rotulo="Bairro"
              className="sm:col-span-2"
              placeholder="Boqueirão"
              value={campos.bairro}
              onChange={(e) => atualizarCampo("bairro", e.target.value)}
            />
            <Campo
              id="uf"
              rotulo="UF"
              className="sm:col-span-1"
              maxLength={2}
              placeholder="SP"
              value={campos.uf}
              onChange={(e) => atualizarCampo("uf", e.target.value.toUpperCase())}
            />
          </div>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 sm:p-7">
          <h2 className="font-heading text-lg font-semibold">Apresentação</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-6">
            <Campo
              id="vagas"
              rotulo="Vagas disponíveis"
              className="sm:col-span-2"
              inputMode="numeric"
              placeholder="0"
              value={campos.vagas}
              onChange={(e) => atualizarCampo("vagas", e.target.value)}
            />
            <Campo
              id="destaque"
              rotulo="Selo (opcional)"
              className="sm:col-span-4"
              placeholder="Mais procurada"
              maxLength={40}
              value={campos.destaque}
              onChange={(e) => atualizarCampo("destaque", e.target.value)}
            />
            <Campo
              id="tags"
              rotulo="Cuidados oferecidos"
              className="sm:col-span-6"
              placeholder="Cuidados 24h, Fisioterapia, Visitas diárias"
              value={campos.tags}
              onChange={(e) => atualizarCampo("tags", e.target.value)}
              dica="Até 6, separados por vírgula."
            />

            <div className="sm:col-span-6">
              <label htmlFor="descricao" className={labelClass}>
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                rows={4}
                maxLength={2000}
                placeholder="Como é a rotina, a equipe e a estrutura da casa."
                value={campos.descricao}
                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                className={cn(inputClass, "resize-y")}
              />
            </div>
          </div>
        </section>

        {!idCasa ? (
          <section className="rounded-sm border border-border bg-card p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-semibold">Fotos da casa (opcional)</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG, WebP ou AVIF até 5 MB cada. A primeira foto será a capa.
                </p>
              </div>
              <div>
                <input
                  ref={inputFotosRef}
                  id="cadastro-casa-fotos"
                  type="file"
                  accept={ACCEPT_IMAGENS}
                  multiple
                  disabled={ocupado || fotosFila.length >= MAX_FOTOS_CADASTRO}
                  onChange={(e) => {
                    adicionarFotosFila(e.target.files);
                    e.target.value = "";
                  }}
                  className="sr-only"
                />
                <button
                  type="button"
                  disabled={ocupado || fotosFila.length >= MAX_FOTOS_CADASTRO}
                  onClick={() => inputFotosRef.current?.click()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  <ImagePlus className="size-4 text-brand-strong" aria-hidden="true" />
                  Selecionar fotos ({fotosFila.length}/{MAX_FOTOS_CADASTRO})
                </button>
              </div>
            </div>

            {erroFoto ? (
              <p
                role="alert"
                className="mt-4 border-l-2 border-danger px-3 py-2 text-xs text-danger"
              >
                {erroFoto}
              </p>
            ) : null}

            {fotosFila.length > 0 ? (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fotosFila.map((foto, indice) => (
                  <li
                    key={foto.id}
                    className="flex flex-col overflow-hidden rounded-sm border border-border bg-background/60"
                  >
                    <div className="relative aspect-[4/3] w-full bg-secondary">
                      <Image
                        src={foto.preview}
                        alt={foto.legenda || `Pré-visualização ${indice + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      {indice === 0 ? (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary-foreground">
                          <Star className="size-3 fill-current" aria-hidden="true" />
                          Capa
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2 p-2.5">
                      <input
                        type="text"
                        maxLength={160}
                        value={foto.legenda}
                        disabled={ocupado}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setFotosFila((atual) =>
                            atual.map((f) => (f.id === foto.id ? { ...f, legenda: valor } : f)),
                          );
                        }}
                        placeholder="Legenda opcional"
                        aria-label={`Legenda da foto ${indice + 1}`}
                        className="min-h-8 w-full border-b border-input bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-brand-strong"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {indice > 0 ? (
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => definirCapaFila(foto.id)}
                            className="inline-flex min-h-7 items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-[0.7rem] font-medium hover:bg-secondary"
                          >
                            <Star className="size-3 text-brand-strong" aria-hidden="true" />
                            Capa
                          </button>
                        ) : (
                          <span className="text-[0.7rem] text-muted-foreground">Foto principal</span>
                        )}
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => removerFotoFila(foto.id)}
                          aria-label={`Remover foto ${indice + 1}`}
                          className="inline-flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-danger/40 hover:text-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={ocupado}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {ocupado && <Loader2 className="size-4 animate-spin" />}
            {enviandoFotos ? "Enviando fotos..." : rotulo}
          </button>
          <Link
            href={voltarPara}
            className="rounded-sm border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Cancelar
          </Link>
        </div>

        {estado.erro ? (
          <p
            role="alert"
            className="border-l-2 border-danger bg-card px-4 py-3 text-xs leading-relaxed text-danger"
          >
            {estado.erro}
          </p>
        ) : null}

        {estado.ok ? (
          <p
            role="status"
            className="border-l-2 border-brand-strong bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground"
          >
            {estado.ok}
          </p>
        ) : null}
      </form>
    </div>
  );
}
