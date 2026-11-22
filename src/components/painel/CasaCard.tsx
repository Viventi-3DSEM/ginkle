import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Star, UserRound } from "lucide-react";
import type { CasaDoGestor } from "@/lib/painel/dados";

/** Card da casa no painel: capa, situação e os números que o gestor acompanha. */
export default function CasaCard({ casa }: { casa: CasaDoGestor }) {
  return (
    <Link
      href={`/gerente/casas/${casa.id}`}
      className="group flex gap-4 rounded-sm border border-border bg-card p-4 transition-colors hover:border-brand-strong/50"
    >
      <div className="relative hidden h-24 w-32 shrink-0 overflow-hidden rounded-sm bg-secondary sm:block">
        <Image
          src={casa.capaUrl ?? "/images/casa.jpg"}
          alt=""
          fill
          sizes="128px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-base font-semibold">{casa.nome}</h3>
          {casa.publicado ? null : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Rascunho
            </span>
          )}
          {casa.destaque ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
              {casa.destaque}
            </span>
          ) : null}
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden="true" />
          {casa.bairro}, {casa.cidade} · {casa.uf}
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Residentes ativos</dt>
            <UserRound className="size-3.5" aria-hidden="true" />
            <dd>
              <span className="font-semibold text-foreground">{casa.residentes}</span> residentes
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Equipe</dt>
            <dd>
              <span className="font-semibold text-foreground">{casa.equipe}</span> na equipe
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Vagas</dt>
            <dd>
              <span className="font-semibold text-foreground">{casa.vagas}</span> vagas
            </dd>
          </div>
          {casa.nota === null ? null : (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Avaliação média</dt>
              <Star className="size-3.5 fill-brand-strong text-brand-strong" aria-hidden="true" />
              <dd>
                <span className="font-semibold text-foreground">{casa.nota.toFixed(1)}</span> (
                {casa.avaliacoes})
              </dd>
            </div>
          )}
        </dl>

        {casa.solicitacoes > 0 ? (
          <p className="mt-2 text-xs font-medium text-warning">
            {casa.solicitacoes} solicitaç{casa.solicitacoes === 1 ? "ão" : "ões"} aguardando resposta
          </p>
        ) : null}
      </div>

      <ArrowRight
        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
