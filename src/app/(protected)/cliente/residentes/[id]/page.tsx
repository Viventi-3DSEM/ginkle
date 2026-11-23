import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import TimelineResidente from "@/components/portal/TimelineResidente";
import { residenteDoFamiliar } from "@/lib/portal/dados";
import {
  chaveDia,
  dataCurta,
  idade,
  iniciais,
  rotuloSexo,
  rotuloStatusResidente,
} from "@/lib/portal/formato";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const residente = await residenteDoFamiliar(id);
  return { title: residente ? residente.nome : "Residente não encontrado" };
}

function Numero({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {rotulo}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold leading-none">{valor}</p>
      {detalhe ? <p className="mt-1.5 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      {descricao ? <p className="mt-1 text-xs text-muted-foreground">{descricao}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function ResidenteDetalhePage({ params }: Props) {
  const { id } = await params;
  const residente = await residenteDoFamiliar(id);
  if (!residente) notFound();

  const anos = idade(residente.nascimento);
  const diaHoje = chaveDia(new Date());

  return (
    <div className="space-y-6">
      <Link
        href="/cliente/residentes"
        className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Residentes
      </Link>

      <header className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-base font-bold text-brand-strong"
          >
            {iniciais(residente.nome)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold">{residente.nome}</h1>
              <span
                className={
                  residente.status === "ATIVO"
                    ? "rounded-full bg-secondary px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong"
                    : "rounded-full bg-muted px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground"
                }
              >
                {rotuloStatusResidente(residente.status)}
              </span>
              {residente.responsavelPrincipal ? (
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
                  Responsável principal
                </span>
              ) : null}
            </div>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{residente.parentesco}</span>
              {anos !== null ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{anos} anos</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4 shrink-0" aria-hidden="true" />
                {residente.casa
                  ? `${residente.casa.nome} · ${residente.casa.bairro}, ${residente.casa.cidade}`
                  : "Instituição vinculada"}
              </span>
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Numero
          rotulo="Registros (7 dias)"
          valor={String(residente.registros7d)}
          detalhe="Cuidados lançados na última semana"
        />
        <Numero
          rotulo="Linha do tempo"
          valor={String(residente.totalRegistros)}
          detalhe={
            residente.totalRegistros > residente.registros.length
              ? `Mostrando os ${residente.registros.length} mais recentes`
              : "Total de registros disponíveis"
          }
        />
        <Numero
          rotulo="Na casa desde"
          valor={dataCurta(residente.ingresso)}
          detalhe="Data de ingresso registrada"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Ficha do residente">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Data de nascimento</dt>
              <dd className="font-medium">
                {dataCurta(residente.nascimento)}
                {anos !== null ? ` (${anos} anos)` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-muted-foreground">Sexo</dt>
              <dd className="font-medium">{rotuloSexo(residente.sexo)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-muted-foreground">Seu vínculo</dt>
              <dd className="font-medium">
                {residente.parentesco}
                {residente.responsavelPrincipal ? " · responsável principal" : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-muted-foreground">Situação</dt>
              <dd className="font-medium">{rotuloStatusResidente(residente.status)}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Observações médicas
            </h3>
            {residente.observacoesMedicas ? (
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {residente.observacoesMedicas}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma observação médica registrada pela instituição.
              </p>
            )}
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-strong" aria-hidden="true" />
              Dado sensível de saúde (LGPD): visível apenas para familiares vinculados e
              equipe autorizada da casa.
            </p>
          </div>
        </Secao>

        <Secao titulo="Instituição vinculada">
          {residente.casa ? (
            <div className="space-y-4">
              <div className="relative h-36 w-full overflow-hidden rounded-sm bg-secondary">
                <Image
                  src={residente.casa.capaUrl ?? "/images/casa.jpg"}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-cover"
                />
              </div>

              <div>
                <h3 className="font-heading text-base font-semibold">{residente.casa.nome}</h3>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {residente.casa.endereco} — {residente.casa.bairro}, {residente.casa.cidade} ·{" "}
                    {residente.casa.uf}
                  </span>
                </p>
              </div>

              <dl className="space-y-2.5 border-t border-border pt-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">Telefone</dt>
                  <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <dd>
                    <a
                      href={`tel:${residente.casa.telefone}`}
                      className="transition-colors hover:text-brand-strong"
                    >
                      {residente.casa.telefone}
                    </a>
                  </dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">E-mail</dt>
                  <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <dd className="min-w-0 break-all">
                    <a
                      href={`mailto:${residente.casa.email}`}
                      className="transition-colors hover:text-brand-strong"
                    >
                      {residente.casa.email}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/cliente/chat?casa=${residente.casa.id}`}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <MessageSquare className="size-3.5" aria-hidden="true" />
                  Falar com a casa
                </Link>
                {residente.casa.publicado ? (
                  <>
                    <Link
                      href="/cliente/avaliacoes"
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3.5 py-2 text-xs font-medium transition-colors hover:bg-secondary"
                    >
                      <Star className="size-3.5 text-brand-strong" aria-hidden="true" />
                      Avaliar casa
                    </Link>
                    <Link
                      href={`/casas/${residente.casa.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3.5 py-2 text-xs font-medium transition-colors hover:bg-secondary"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      Ver página no diretório
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Os dados públicos desta instituição não estão disponíveis no diretório no
              momento.
            </p>
          )}
        </Secao>
      </div>

      <Secao
        titulo="Linha do tempo de cuidados"
        descricao="Registros lançados pela equipe em ordem cronológica."
      >
        <TimelineResidente registros={residente.registros} diaHoje={diaHoje} />
      </Secao>
    </div>
  );
}
