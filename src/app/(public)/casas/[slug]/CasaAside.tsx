import Link from "next/link";
import { ArrowRight, BedDouble, Mail, Phone } from "lucide-react";
import type { IlpiCompleta } from "@/lib/ilpi/tipos";

const brl = (valor: number) => valor.toLocaleString("pt-BR");

export default function CasaAside({ casa }: { casa: IlpiCompleta }) {
  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="font-sans text-xs uppercase tracking-wide text-muted-foreground">
          {casa.mensalidade !== null ? "Mensalidade a partir de" : "Mensalidade"}
        </p>
        <p className="mt-1 font-heading text-3xl font-semibold">
          {casa.mensalidade !== null ? `R$ ${brl(casa.mensalidade)}` : "Sob consulta"}
          {casa.mensalidade !== null ? (
            <span className="font-sans text-sm font-normal text-muted-foreground">/mês</span>
          ) : null}
        </p>

        <dl className="mt-5 space-y-3 border-t border-border pt-5 font-sans text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <BedDouble className="size-4" aria-hidden="true" />
              Vagas disponíveis
            </dt>
            <dd className="font-medium">{casa.vagas}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Avaliações</dt>
            <dd className="font-medium">{casa.totalAvaliacoes}</dd>
          </div>
        </dl>

        <Link
          href={`/cliente/solicitacoes?casa=${encodeURIComponent(casa.slug)}`}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-sans text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Solicitar entrada
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>

        <p className="mt-3 font-sans text-xs leading-relaxed text-muted-foreground">
          Envie o pedido pela sua conta. Ainda não tem cadastro?{" "}
          <Link
            href={`/cadastro?casa=${encodeURIComponent(casa.slug)}`}
            className="font-medium text-brand-strong hover:underline"
          >
            Criar conta
          </Link>
          .
        </p>

        <div className="mt-5 space-y-2 border-t border-border pt-5 font-sans text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Phone className="size-3.5" aria-hidden="true" />
            {casa.telefone}
          </p>
          <p className="flex items-center gap-2 break-all">
            <Mail className="size-3.5" aria-hidden="true" />
            {casa.email}
          </p>
        </div>
      </div>
    </aside>
  );
}