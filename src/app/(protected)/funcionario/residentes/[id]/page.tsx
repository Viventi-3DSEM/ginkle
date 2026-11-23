import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Building2,
  ClipboardPlus,
  Mail,
  Phone,
  Pill,
  ShieldCheck,
} from "lucide-react";
import BannerFilaOffline from "@/components/funcionario/BannerFilaOffline";
import TimelineResidente from "@/components/portal/TimelineResidente";
import { residenteDoFuncionario } from "@/lib/funcionario/dados";
import {
  chaveDia,
  dataCurta,
  idade,
  iniciais,
  rotuloSexo,
  rotuloStatusResidente,
} from "@/lib/painel/formato";
import { formatarTelefone } from "@/lib/validacao/telefone";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const residente = await residenteDoFuncionario(id);
  return { title: residente ? residente.nome : "Residente não encontrado" };
}

export default async function ResidenteFuncionarioDetalhePage({ params }: Props) {
  const { id } = await params;
  const residente = await residenteDoFuncionario(id);
  if (!residente) notFound();

  const anos = idade(residente.nascimento);
  const diaHoje = chaveDia(new Date());

  return (
    <div className="space-y-6">
      <Link
        href="/funcionario/residentes"
        className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Residentes
      </Link>

      <header className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-base font-bold text-brand-strong"
            >
              {iniciais(residente.nome)}
            </span>

            <div className="min-w-0">
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
              </div>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                {anos !== null ? <span>{anos} anos</span> : null}
                {anos !== null ? <span aria-hidden="true">·</span> : null}
                <span>{rotuloSexo(residente.sexo)}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-4 shrink-0" aria-hidden="true" />
                  {residente.casaNome}
                </span>
              </p>
            </div>
          </div>

          {residente.status === "ATIVO" ? (
            <Link
              href={`/funcionario/novo-registro?residente=${residente.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ClipboardPlus className="size-4" aria-hidden="true" />
              Novo registro
            </Link>
          ) : null}
        </div>

        {residente.status === "ATIVO" ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Link
              href={`/funcionario/novo-registro?residente=${residente.id}&tipo=MEDICAMENTO`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Pill className="size-3.5 text-info" aria-hidden="true" />
              Medicamento
            </Link>
            <Link
              href={`/funcionario/novo-registro?residente=${residente.id}&tipo=SINAL_VITAL`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Activity className="size-3.5 text-success" aria-hidden="true" />
              Sinal vital
            </Link>
            <Link
              href={`/funcionario/novo-registro?residente=${residente.id}&tipo=OCORRENCIA`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <AlertTriangle className="size-3.5 text-warning" aria-hidden="true" />
              Ocorrência
            </Link>
          </div>
        ) : null}
      </header>

      <BannerFilaOffline residenteId={residente.id} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Registros hoje
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold leading-none">
            {residente.registrosHoje}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">Lançados no dia atual</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Últimos 7 dias
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold leading-none">
            {residente.registros7d}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {residente.totalRegistros} no histórico total
          </p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Na casa desde
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold leading-none">
            {dataCurta(residente.ingresso)}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Nasc. {dataCurta(residente.nascimento)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">Observações médicas</h2>
          {residente.observacoesMedicas ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
              {residente.observacoesMedicas}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma observação médica registrada para este residente.
            </p>
          )}
          <p className="mt-4 flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-strong" aria-hidden="true" />
            Dado sensível de saúde (LGPD): restrito à equipe autorizada da casa e aos familiares
            vinculados.
          </p>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">Contatos da família</h2>
          {residente.familiares.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum familiar vinculado ainda. O gestor pode fazer o vínculo na aba Residentes.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {residente.familiares.map((f) => (
                <li key={f.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{f.nome}</p>
                    <span className="text-xs text-muted-foreground">({f.parentesco})</span>
                    {f.responsavelPrincipal ? (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
                        Principal
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {f.telefone ? (
                      <a
                        href={`tel:${f.telefone}`}
                        className="inline-flex items-center gap-1 font-medium text-brand-strong hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden="true" />
                        {formatarTelefone(f.telefone)}
                      </a>
                    ) : null}
                    {f.email ? (
                      <a
                        href={`mailto:${f.email}`}
                        className="inline-flex items-center gap-1 break-all hover:text-foreground"
                      >
                        <Mail className="size-3.5" aria-hidden="true" />
                        {f.email}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg font-semibold">Linha do tempo assistencial</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {residente.totalRegistros > residente.registros.length
                ? `Mostrando os ${residente.registros.length} registros mais recentes de ${residente.totalRegistros}.`
                : "Registros sincronizados em ordem cronológica."}
            </p>
          </div>
        </div>
        <TimelineResidente registros={residente.registros} diaHoje={diaHoje} />
      </section>
    </div>
  );
}
