import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
} from "lucide-react";
import GerenciadorFotosCasa from "@/components/painel/GerenciadorFotosCasa";
import VisibilidadeCasa from "@/components/painel/VisibilidadeCasa";
import { casaDoGestor } from "@/lib/painel/dados";
import { dataCurta, idade, reais } from "@/lib/painel/formato";

type Props = { params: Promise<{ id: string }> };

const STATUS_RESIDENTE: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  ALTA: "Alta",
  OBITO: "Óbito",
};

const STATUS_ADESAO: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const casa = await casaDoGestor(id);
  return { title: casa ? casa.nome : "Casa não encontrada" };
}

function Secao({
  titulo,
  acao,
  children,
  className,
}: {
  titulo: string;
  acao?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-sm border border-border bg-card p-5 sm:p-6 ${className ?? ""}`}>
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

function Vazio({ texto }: { texto: string }) {
  return <p className="text-sm text-muted-foreground">{texto}</p>;
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
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

export default async function CasaDetalhePage({ params }: Props) {
  const { id } = await params;
  const casa = await casaDoGestor(id);
  if (!casa) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/gerente/casas"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Minhas casas
      </Link>

      <div className="overflow-hidden rounded-sm border border-border bg-card">
        <div className="relative h-40 w-full bg-secondary sm:h-52">
          <Image
            src={casa.capaUrl ?? "/images/casa.jpg"}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
            priority
          />
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold">{casa.nome}</h1>
                {casa.publicado ? (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
                    Pública
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Privada
                  </span>
                )}
                {casa.destaque ? (
                  <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
                    {casa.destaque}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {casa.bairro}, {casa.cidade} · {casa.uf}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {casa.publicado ? (
                <Link
                  href={`/casas/${casa.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Ver página
                </Link>
              ) : null}
              <Link
                href={`/gerente/casas/${casa.id}/editar`}
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Pencil className="size-4" aria-hidden="true" />
                Editar casa
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <VisibilidadeCasa casaId={casa.id} publicado={casa.publicado} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          rotulo="Residentes"
          valor={String(casa.residentes)}
          detalhe={
            casa.residentesLista.length === casa.residentes
              ? "Ativos"
              : `${casa.residentesLista.length} cadastrados no total`
          }
        />
        <Numero rotulo="Equipe" valor={String(casa.equipe)} detalhe="Profissionais ativos" />
        <Numero rotulo="Vagas" valor={String(casa.vagas)} detalhe="Disponíveis" />
        <Numero
          rotulo="Avaliação"
          valor={casa.nota === null ? "—" : casa.nota.toFixed(1)}
          detalhe={
            casa.avaliacoes === 0
              ? "Sem avaliações"
              : `${casa.avaliacoes} avaliaç${casa.avaliacoes === 1 ? "ão" : "ões"}`
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Sobre a casa">
          {casa.descricao ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{casa.descricao}</p>
          ) : (
            <Vazio texto="Adicione uma descrição na edição da casa." />
          )}
          {casa.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {casa.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-brand-strong"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </Secao>

        <Secao titulo="Contato e localização">
          <dl className="space-y-3 text-sm">
            <div className="flex gap-2.5">
              <dt className="sr-only">Telefone</dt>
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dd>
                <a href={`tel:${casa.telefone}`} className="hover:text-brand-strong">
                  {casa.telefone}
                </a>
              </dd>
            </div>
            <div className="flex gap-2.5">
              <dt className="sr-only">E-mail</dt>
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dd className="min-w-0 break-all">
                <a href={`mailto:${casa.email}`} className="hover:text-brand-strong">
                  {casa.email}
                </a>
              </dd>
            </div>
            {casa.site ? (
              <div className="flex gap-2.5">
                <dt className="sr-only">Site</dt>
                <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <dd className="min-w-0 break-all">
                  <a
                    href={casa.site}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-strong"
                  >
                    {casa.site.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            ) : null}
            <div className="flex gap-2.5 border-t border-border pt-3">
              <dt className="shrink-0 text-muted-foreground">Endereço</dt>
              <dd>
                {casa.endereco}
                <br />
                {casa.bairro}, {casa.cidade} · {casa.uf}
              </dd>
            </div>
            <div className="flex gap-2.5">
              <dt className="shrink-0 text-muted-foreground">CNPJ</dt>
              <dd>{casa.cnpj}</dd>
            </div>
            <div className="flex gap-2.5">
              <dt className="shrink-0 text-muted-foreground">Cadastrada em</dt>
              <dd>{dataCurta(casa.criadaEm)}</dd>
            </div>
          </dl>
        </Secao>
      </div>

      <Secao
        titulo="Residentes"
        acao={{ href: `/gerente/residentes?casa=${casa.id}`, label: "Gerenciar" }}
      >
        {casa.residentesLista.length === 0 ? (
          <Vazio texto="Nenhum residente cadastrado ainda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-semibold">Nome</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Idade</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Ingresso</th>
                  <th scope="col" className="py-2 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {casa.residentesLista.map((residente) => (
                  <tr key={residente.id}>
                    <td className="py-2.5 pr-4 font-medium">{residente.nome}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {idade(residente.nascimento) ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {dataCurta(residente.ingresso)}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {STATUS_RESIDENTE[residente.status] ?? residente.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao
          titulo="Equipe"
          acao={{ href: `/gerente/equipe?casa=${casa.id}`, label: "Gerenciar" }}
        >
          {casa.colaboradores.length === 0 ? (
            <Vazio texto="Nenhum outro profissional vinculado." />
          ) : (
            <ul className="divide-y divide-border">
              {casa.colaboradores.map((pessoa) => (
                <li key={pessoa.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{pessoa.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Desde {dataCurta(pessoa.desde)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-brand-strong">
                    {pessoa.cargo === "GESTOR" ? "Gestor" : "Funcionário"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao
          titulo="Planos e mensalidades"
          acao={{ href: `/gerente/planos?casa=${casa.id}`, label: "Gerenciar" }}
        >
          {casa.planos.length === 0 ? (
            <Vazio texto="Nenhum plano cadastrado." />
          ) : (
            <ul className="divide-y divide-border">
              {casa.planos.map((plano) => (
                <li key={plano.id} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{plano.nome}</p>
                    {plano.descricao ? (
                      <p className="text-xs text-muted-foreground">{plano.descricao}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    R$ {reais(plano.valor)}
                    {plano.ativo ? null : (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        inativo
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>

      <Secao titulo="Fotos da casa">
        <GerenciadorFotosCasa casaId={casa.id} fotos={casa.fotos} />
      </Secao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao
          titulo="Solicitações de entrada"
          acao={{ href: `/gerente/residentes?casa=${casa.id}`, label: "Gerenciar" }}
        >
          {casa.solicitacoesLista.length === 0 ? (
            <Vazio texto="Nenhuma solicitação recebida." />
          ) : (
            <ul className="divide-y divide-border">
              {casa.solicitacoesLista.map((solicitacao) => (
                <li key={solicitacao.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{solicitacao.solicitante}</p>
                    <p className="text-xs text-muted-foreground">{dataCurta(solicitacao.quando)}</p>
                  </div>
                  <span
                    className={
                      solicitacao.status === "PENDENTE"
                        ? "rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {STATUS_ADESAO[solicitacao.status] ?? solicitacao.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Avaliações">
          {casa.avaliacoesLista.length === 0 ? (
            <Vazio texto="Esta casa ainda não recebeu avaliações." />
          ) : (
            <ul className="space-y-4">
              {casa.avaliacoesLista.map((avaliacao, indice) => (
                <li
                  key={`${avaliacao.autor}-${indice}`}
                  className="border-t border-border pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex gap-0.5" aria-label={`${avaliacao.nota} de 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={
                            n <= avaliacao.nota
                              ? "size-3.5 fill-brand-strong text-brand-strong"
                              : "size-3.5 text-border"
                          }
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                    <span className="text-sm font-medium">{avaliacao.autor}</span>
                    <span className="text-xs text-muted-foreground">
                      {dataCurta(avaliacao.quando)}
                    </span>
                  </div>
                  {avaliacao.comentario ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {avaliacao.comentario}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </div>
  );
}
