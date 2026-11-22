"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Estado } from "@/lib/painel/actions";
import { formatarCnpj } from "@/lib/validacao/cnpj";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { slugificar } from "@/lib/validacao/slug";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full border-b border-input bg-transparent py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong";

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

export default function CasaForm({
  acao,
  titulo,
  subtitulo,
  rotulo,
  voltarPara,
  idCasa,
  valores,
}: Props) {
  const inicial = valores ?? VAZIO;
  const [estado, enviar, enviando] = useActionState<Estado, FormData>(acao, {});

  const [nome, setNome] = useState(inicial.nome);
  const [slug, setSlug] = useState(inicial.slug);
  const [slugTravado, setSlugTravado] = useState(Boolean(inicial.slug));
  const [cnpj, setCnpj] = useState(inicial.cnpj);
  const [telefone, setTelefone] = useState(inicial.telefone);

  const slugAtual = slugTravado ? slug : slugificar(nome);

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
        <input type="hidden" name="cnpjAtual" value={inicial.cnpj.replace(/\D/g, "")} />

        <section className="rounded-sm border border-border bg-card p-5 sm:p-7">
          <h2 className="font-heading text-lg font-semibold">Identificação</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Campo
              id="nome"
              rotulo="Nome da instituição"
              className="sm:col-span-2"
              placeholder="ILPI Vida Plena"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <Campo
              id="slug"
              rotulo="Endereço da página"
              placeholder="vida-plena"
              value={slugAtual}
              onChange={(e) => {
                setSlugTravado(true);
                setSlug(e.target.value);
              }}
              dica={`Aparece em ginkle.me/casas/${slugAtual || "sua-casa"}`}
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
                value={cnpj}
                onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
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
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                className={inputClass}
              />
            </div>

            <Campo
              id="email"
              rotulo="E-mail de contato"
              type="email"
              placeholder="contato@suacasa.com.br"
              defaultValue={inicial.email}
            />

            <Campo
              id="site"
              rotulo="Site (opcional)"
              placeholder="suacasa.com.br"
              defaultValue={inicial.site}
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
              defaultValue={inicial.endereco}
            />
            <Campo
              id="cidade"
              rotulo="Cidade"
              className="sm:col-span-3"
              placeholder="Praia Grande"
              defaultValue={inicial.cidade}
            />
            <Campo
              id="bairro"
              rotulo="Bairro"
              className="sm:col-span-2"
              placeholder="Boqueirão"
              defaultValue={inicial.bairro}
            />
            <Campo
              id="uf"
              rotulo="UF"
              className="sm:col-span-1"
              maxLength={2}
              placeholder="SP"
              defaultValue={inicial.uf}
            />
          </div>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 sm:p-7">
          <h2 className="font-heading text-lg font-semibold">Vitrine</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            É o que as famílias veem no diretório.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-6">
            <Campo
              id="vagas"
              rotulo="Vagas disponíveis"
              className="sm:col-span-2"
              inputMode="numeric"
              placeholder="0"
              defaultValue={inicial.vagas}
            />
            <Campo
              id="destaque"
              rotulo="Selo (opcional)"
              className="sm:col-span-4"
              placeholder="Mais procurada"
              maxLength={40}
              defaultValue={inicial.destaque}
            />
            <Campo
              id="tags"
              rotulo="Cuidados oferecidos"
              className="sm:col-span-6"
              placeholder="Cuidados 24h, Fisioterapia, Visitas diárias"
              defaultValue={inicial.tags}
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
                defaultValue={inicial.descricao}
                className={cn(inputClass, "resize-y")}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando && <Loader2 className="size-4 animate-spin" />}
            {rotulo}
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
