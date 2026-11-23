import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin, Star } from "lucide-react";
import type { IlpiCompleta } from "@/lib/ilpi/tipos";

export default function CasaHero({ casa }: { casa: IlpiCompleta }) {
  const fotos = casa.fotos.length > 0 ? casa.fotos : [{ url: casa.capaUrl, legenda: null }];
  const nota = casa.totalAvaliacoes > 0 ? casa.nota.toFixed(1).replace(".", ",") : null;

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 md:pt-12">
        <nav aria-label="Você está aqui" className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/casas" className="hover:text-brand-strong">
            Casas
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="truncate">{casa.nome}</span>
        </nav>

        {fotos.length === 1 ? (
          <div className="relative mt-5 aspect-[16/9] max-h-[26rem] w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={fotos[0].url}
              alt={fotos[0].legenda ?? `Fachada de ${casa.nome}, em ${casa.cidade}`}
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
            {casa.destaque ? (
              <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 font-sans text-[11px] font-medium text-foreground shadow-sm">
                {casa.destaque}
              </span>
            ) : null}
          </div>
        ) : fotos.length === 2 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {fotos.map((foto, idx) => (
              <div
                key={`${foto.url}-${idx}`}
                className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted sm:min-h-[20rem]"
              >
                <Image
                  src={foto.url}
                  alt={
                    foto.legenda ??
                    (idx === 0
                      ? `Fachada de ${casa.nome}, em ${casa.cidade}`
                      : `Interior de ${casa.nome}`)
                  }
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                {idx === 0 && casa.destaque ? (
                  <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 font-sans text-[11px] font-medium text-foreground shadow-sm">
                    {casa.destaque}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[2fr_1fr] sm:grid-rows-2">
              <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-xl bg-muted sm:col-span-1 sm:row-span-2 sm:aspect-auto sm:min-h-[22rem]">
                <Image
                  src={fotos[0].url}
                  alt={fotos[0].legenda ?? `Fachada de ${casa.nome}, em ${casa.cidade}`}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 66vw"
                  className="object-cover"
                />
                {casa.destaque ? (
                  <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 font-sans text-[11px] font-medium text-foreground shadow-sm">
                    {casa.destaque}
                  </span>
                ) : null}
              </div>

              {fotos.slice(1, 3).map((foto, idx) => (
                <div
                  key={`${foto.url}-${idx}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-auto"
                >
                  <Image
                    src={foto.url}
                    alt={foto.legenda ?? `Interior de ${casa.nome}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {fotos.length > 3 ? (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {fotos.slice(3, 12).map((foto, idx) => (
                  <li
                    key={`${foto.url}-extra-${idx}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={foto.url}
                      alt={foto.legenda ?? `Espaço de ${casa.nome}`}
                      fill
                      sizes="(max-width: 640px) 33vw, 180px"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-4 pb-10 pt-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-heading text-[clamp(1.9rem,4vw,2.8rem)] font-semibold leading-tight">
              {casa.nome}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 font-sans text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {casa.bairro}, {casa.cidade} · {casa.uf}
            </p>
          </div>

          <div className="shrink-0 font-sans text-sm">
            {nota ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-semibold text-brand-strong">
                <Star className="size-4 fill-brand-strong text-brand-strong" aria-hidden="true" />
                {nota}
                <span className="font-normal text-muted-foreground">
                  ({casa.totalAvaliacoes})
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground">
                Ainda sem avaliações
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}