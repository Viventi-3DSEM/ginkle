import Link from "next/link";
import { ArrowRight, Building2, ClipboardList, Clock } from "lucide-react";
import type { ResidenteVinculado } from "@/lib/portal/dados";
import {
  dataHora,
  idade,
  iniciais,
  rotuloStatusResidente,
  rotuloTipo,
} from "@/lib/portal/formato";

type Props = {
  residente: ResidenteVinculado;
  heading?: "h2" | "h3";
};

export default function ResidenteCard({ residente, heading = "h3" }: Props) {
  const Titulo = heading;
  const anos = idade(residente.nascimento);

  return (
    <Link
      href={`/cliente/residentes/${residente.id}`}
      className="group flex gap-4 rounded-sm border border-border bg-card p-4 transition-colors hover:border-brand-strong/50"
    >
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-sm font-bold text-brand-strong"
      >
        {iniciais(residente.nome)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Titulo className="font-heading text-base font-semibold">{residente.nome}</Titulo>
          <span
            className={
              residente.status === "ATIVO"
                ? "rounded-full bg-secondary px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong"
                : "rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground"
            }
          >
            {rotuloStatusResidente(residente.status)}
          </span>
          {residente.responsavelPrincipal ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
              Responsável principal
            </span>
          ) : null}
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{residente.parentesco}</span>
          {anos !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{anos} anos</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            {residente.casa
              ? `${residente.casa.nome} (${residente.casa.cidade})`
              : "Instituição vinculada"}
          </span>
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Registros nos últimos 7 dias</dt>
            <ClipboardList className="size-3.5 shrink-0" aria-hidden="true" />
            <dd>
              <span className="font-semibold text-foreground">{residente.registros7d}</span>{" "}
              {residente.registros7d === 1 ? "registro" : "registros"} (7d)
            </dd>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <dt className="sr-only">Último registro</dt>
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <dd className="truncate">
              {residente.ultimoRegistro ? (
                <>
                  {rotuloTipo(residente.ultimoRegistro.tipo)}:{" "}
                  <span className="font-medium text-foreground">
                    {residente.ultimoRegistro.titulo}
                  </span>{" "}
                  ·{" "}
                  <time dateTime={residente.ultimoRegistro.quando}>
                    {dataHora(residente.ultimoRegistro.quando)}
                  </time>
                </>
              ) : (
                "Ainda sem registros"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <ArrowRight
        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
