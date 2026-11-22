"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IlpiPublica } from "@/lib/ilpi/tipos";

type Ordem = "relevancia" | "nota" | "menor" | "maior";

const norm = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const brl = (value: number) => value.toLocaleString("pt-BR");

const notaTexto = (casa: IlpiPublica) =>
  casa.totalAvaliacoes > 0 ? casa.nota.toFixed(1).replace(".", ",") : null;

export default function CasasDirectory({ casas }: { casas: IlpiPublica[] }) {
  const [busca, setBusca] = useState("");
  const [cidade, setCidade] = useState("Todas");
  const [ordem, setOrdem] = useState<Ordem>("relevancia");
  const resultadosRef = useRef<HTMLDivElement>(null);

  const cidades = useMemo(
    () => ["Todas", ...Array.from(new Set(casas.map((casa) => casa.cidade))).sort()],
    [casas],
  );

  const filtradas = useMemo(() => {
    const termo = norm(busca.trim());
    const lista = casas.filter((casa) => {
      const combinaCidade = cidade === "Todas" || casa.cidade === cidade;
      const combinaTermo =
        !termo || norm(`${casa.nome} ${casa.bairro} ${casa.cidade}`).includes(termo);
      return combinaCidade && combinaTermo;
    });

    if (ordem === "nota") {
      return [...lista].sort(
        (a, b) => b.nota - a.nota || b.totalAvaliacoes - a.totalAvaliacoes,
      );
    }
    if (ordem === "menor") {
      return [...lista].sort(
        (a, b) => (a.mensalidade ?? Infinity) - (b.mensalidade ?? Infinity),
      );
    }
    if (ordem === "maior") {
      return [...lista].sort((a, b) => (b.mensalidade ?? 0) - (a.mensalidade ?? 0));
    }
    return [...lista].sort(
      (a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)) || b.vagas - a.vagas,
    );
  }, [busca, cidade, ordem, casas]);

  const limpar = () => {
    setBusca("");
    setCidade("Todas");
    setOrdem("relevancia");
  };

  const buscar = () => {
    resultadosRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <main className="flex flex-col bg-background">
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-14 md:pt-20">
          <h1 className="max-w-3xl font-heading text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1.12]">
            Casas de repouso{" "}
            <span className="font-serif italic text-brand-strong">perto de você</span>.
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground">
            Compare estrutura, avaliações e mensalidades de instituições em Praia
            Grande, Santos e região. O contato com a casa é liberado após o
            cadastro.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center">
              <label className="flex flex-1 items-center gap-3 px-4 py-3">
                <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Cidade, bairro ou nome da casa"
                  aria-label="Buscar casa de repouso"
                  className="w-full bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>

              <span className="hidden h-8 w-px bg-border md:block" aria-hidden="true" />

              <label className="flex items-center gap-2 px-4 py-3">
                <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <select
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                  aria-label="Filtrar por cidade"
                  className="w-full cursor-pointer bg-transparent font-sans text-sm text-foreground outline-none md:w-44"
                >
                  {cidades.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={buscar}
                className="m-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-sans text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Search className="size-4" aria-hidden="true" />
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div
          ref={resultadosRef}
          id="resultados"
          className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-10 md:py-14"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {cidades.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCidade(c)}
                  aria-pressed={cidade === c}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 font-sans text-sm transition-colors",
                    cidade === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-brand-strong hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              <select
                value={ordem}
                onChange={(event) => setOrdem(event.target.value as Ordem)}
                aria-label="Ordenar por"
                className="cursor-pointer rounded-lg border border-border bg-card px-3 py-2 font-sans text-sm text-foreground outline-none"
              >
                <option value="relevancia">Relevância</option>
                <option value="nota">Melhor avaliadas</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
              </select>
            </label>
          </div>

          <p className="mt-6 font-sans text-sm text-muted-foreground">
            {filtradas.length}{" "}
            {filtradas.length === 1 ? "casa encontrada" : "casas encontradas"}
            {cidade !== "Todas" ? ` em ${cidade}` : ""}
          </p>

          {filtradas.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center sm:p-14">
              <h2 className="font-heading text-xl font-semibold">
                Nenhuma casa encontrada.
              </h2>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                Tente outra cidade ou um termo de busca diferente.
              </p>
              <button
                type="button"
                onClick={limpar}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 font-sans text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.map((casa) => {
                const nota = notaTexto(casa);
                const href = `/casas/${casa.slug}`;
                return (
                  <li key={casa.slug} className="h-full">
                    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
                      <Link
                        href={href}
                        aria-label={`Ver a casa ${casa.nome}`}
                        className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
                      >
                        <Image
                          src={casa.capaUrl}
                          alt={`Fachada de ${casa.nome}, em ${casa.cidade}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                        />
                        {casa.destaque ? (
                          <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 font-sans text-[11px] font-medium text-foreground shadow-sm">
                            {casa.destaque}
                          </span>
                        ) : null}
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-card px-2 py-1 font-sans text-[11px] font-semibold text-foreground shadow-sm">
                          {nota ? (
                            <>
                              <Star
                                className="size-3 fill-brand-strong text-brand-strong"
                                aria-hidden="true"
                              />
                              {nota}
                            </>
                          ) : (
                            "Novo"
                          )}
                        </span>
                      </Link>

                      <div className="flex flex-1 flex-col p-5">
                        <h2 className="font-heading text-lg font-semibold leading-snug">
                          <Link href={href} className="hover:text-brand-strong">
                            {casa.nome}
                          </Link>
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 font-sans text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                          {casa.bairro}, {casa.cidade}
                        </p>

                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {casa.tags.slice(0, 3).map((tag) => (
                            <li
                              key={tag}
                              className="rounded-full bg-secondary px-2 py-0.5 font-sans text-[11px] font-medium text-brand-strong"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                          <p className="font-sans text-xs text-muted-foreground">
                            {casa.mensalidade !== null ? "a partir de" : "mensalidade"}
                            <span className="mt-0.5 block font-heading text-lg font-semibold text-foreground">
                              {casa.mensalidade !== null ? `R$ ${brl(casa.mensalidade)}` : "sob consulta"}
                              {casa.mensalidade !== null ? (
                                <span className="font-sans text-xs font-normal text-muted-foreground">
                                  /mês
                                </span>
                              ) : null}
                            </span>
                          </p>
                          <Link
                            href={href}
                            className="shrink-0 rounded-lg border border-border px-3 py-2 font-sans text-sm font-medium text-brand-strong transition-colors hover:border-brand-strong hover:bg-secondary"
                          >
                            Ver detalhes
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-10 font-serif text-xs italic text-muted-foreground">
            Catálogo demonstrativo com imagens ilustrativas. As instituições
            reais aparecem aqui após o cadastro.
          </p>
        </div>
      </section>

      <section className="bg-footer text-footer-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 md:flex-row md:items-center md:py-20">
          <div>
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
              Sua casa de repouso no Ginkle.
            </h2>
            <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-footer-muted">
              Cadastre a instituição, mostre a rotina de cuidado e apareça para
              famílias que procuram transparência.
            </p>
          </div>
          <Link
            href="/cadastrar-instituicao"
            className="inline-flex items-center gap-2 rounded-lg bg-[#a3d7a9] px-6 py-3 font-sans text-sm font-medium text-[#0f1f10] transition-opacity hover:opacity-90"
          >
            Cadastrar instituição
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}