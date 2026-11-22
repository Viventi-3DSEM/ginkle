import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Clock,
  HeartHandshake,
  Users,
  type LucideIcon,
} from "lucide-react";
import ResidenteCard from "@/components/portal/ResidenteCard";
import { portalDoFamiliar, type AdesaoDoFamiliar } from "@/lib/portal/dados";
import { dataHora, rotuloStatusAdesao, rotuloTipo } from "@/lib/portal/formato";

export const metadata = { title: "Portal do familiar" };

function Stat({
  rotulo,
  valor,
  detalhe,
  Icone,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  Icone: LucideIcon;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {rotulo}
        </p>
        <Icone className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold leading-none sm:text-3xl">{valor}</p>
      {detalhe ? <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

function Bloco({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
        {acao ? (
          <Link
            href={acao.href}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand-strong"
          >
            {acao.label}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListaAdesoes({ adesoes }: { adesoes: AdesaoDoFamiliar[] }) {
  if (adesoes.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Você não tem solicitações de entrada abertas no momento.
        </p>
        <Link
          href="/casas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong hover:underline"
        >
          Explorar casas de repouso
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {adesoes.slice(0, 5).map((adesao) => (
        <li
          key={adesao.id}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            {adesao.casaSlug && adesao.casaPublicada ? (
              <Link
                href={`/casas/${adesao.casaSlug}`}
                className="block truncate text-sm font-medium transition-colors hover:text-brand-strong"
              >
                {adesao.casaNome}
              </Link>
            ) : (
              <p className="truncate text-sm font-medium">{adesao.casaNome}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pedido em <time dateTime={adesao.quando}>{dataHora(adesao.quando)}</time>
            </p>
          </div>
          <span
            className={
              adesao.status === "PENDENTE"
                ? "shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong"
                : "shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {rotuloStatusAdesao(adesao.status)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function PortalInicioPage() {
  const { residentes, resumo, atividade, adesoes } = await portalDoFamiliar();

  if (residentes.length === 0) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Portal do familiar</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Quando uma instituição vincular sua conta a um residente, o prontuário e a linha
            do tempo de cuidados passam a aparecer aqui.
          </p>
        </header>

        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <HeartHandshake className="mx-auto size-8 text-brand-strong" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Nenhum residente vinculado ainda
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            O vínculo com o residente é confirmado pela equipe da casa de repouso para
            proteger os dados de saúde. Se ainda está procurando uma instituição, comece
            pelo diretório.
          </p>
          <Link
            href="/casas"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explorar casas de repouso
          </Link>
        </div>

        {adesoes.length > 0 ? (
          <Bloco titulo="Suas solicitações de entrada">
            <ListaAdesoes adesoes={adesoes} />
          </Bloco>
        ) : null}

        <section className="rounded-sm border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-5 shrink-0 text-brand-strong" aria-hidden="true" />
              <div>
                <h2 className="font-heading text-base font-semibold">
                  É gestor de uma casa de repouso?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use a mesma conta para cadastrar sua instituição, publicar no diretório e
                  organizar equipe e residentes.
                </p>
              </div>
            </div>
            <Link
              href="/cadastrar-instituicao"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Cadastrar instituição
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Portal do familiar</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Acompanhe os cuidados registrados pela equipe para os residentes vinculados à sua
          conta, com horário do dispositivo e confirmação de sincronização.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          rotulo="Residentes"
          valor={String(resumo.residentes)}
          detalhe={
            resumo.residentesAtivos === resumo.residentes
              ? `${resumo.residentesAtivos} com acompanhamento ativo`
              : `${resumo.residentesAtivos} ativo${resumo.residentesAtivos === 1 ? "" : "s"} de ${resumo.residentes}`
          }
          Icone={Users}
        />
        <Stat
          rotulo="Registros (7 dias)"
          valor={String(resumo.registros7d)}
          detalhe="Cuidados, medicamentos, sinais vitais e ocorrências"
          Icone={ClipboardList}
        />
        <Stat
          rotulo="Última atualização"
          valor={resumo.ultimaAtualizacao ? dataHora(resumo.ultimaAtualizacao) : "—"}
          detalhe={
            resumo.ultimaAtualizacao
              ? "Horário registrado no dispositivo da equipe"
              : "Ainda sem registros na linha do tempo"
          }
          Icone={Clock}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">Residentes vinculados</h2>
          <Link
            href="/cliente/residentes"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand-strong"
          >
            Ver todos
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="space-y-3">
          {residentes.slice(0, 3).map((residente) => (
            <ResidenteCard key={residente.id} residente={residente} heading="h3" />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloco titulo="Atividade recente">
          {atividade.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum registro recente. Os cuidados lançados pela equipe aparecem aqui assim
              que forem sincronizados.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {atividade.map((registro) => (
                <li key={registro.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/cliente/residentes/${registro.residenteId}`}
                    className="group flex gap-3"
                  >
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-strong"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium transition-colors group-hover:text-brand-strong">
                        {registro.titulo}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {rotuloTipo(registro.tipo)} · {registro.residenteNome} ·{" "}
                        <time dateTime={registro.criadoEm}>{dataHora(registro.criadoEm)}</time>
                        {registro.autorNome ? ` · ${registro.autorNome}` : ""}
                      </p>
                      {registro.atrasado ? (
                        <p className="mt-1 text-xs font-medium text-warning">
                          Sincronizado com atraso (mais de 10 minutos)
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Bloco>

        <Bloco titulo="Solicitações de entrada">
          <ListaAdesoes adesoes={adesoes} />
        </Bloco>
      </div>
    </div>
  );
}
