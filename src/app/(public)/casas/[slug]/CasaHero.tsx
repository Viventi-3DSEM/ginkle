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

        <div className="mt-5 grid gap-2 sm:grid-cols-[2fr_1fr] sm:grid-rows-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted sm:row-span-2 sm:aspect-auto sm:min-h-[22rem]">
            <Image
              src={fotos[0].url}
              alt={`Fachada de ${casa.nome}, em ${casa.cidade}`}
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

          {fotos.slice(1, 3).map((foto) => (
            <div
              key={foto.url}
              className="relative hidden overflow-hidden rounded-xl bg-muted sm:block"
            >
              <Image
                src={foto.url}
                alt={foto.legenda ?? `Interior de ${casa.nome}`}
                fill
                sizes="33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

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