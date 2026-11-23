import Link from "next/link";
import { Building2 } from "lucide-react";
import PainelAuditoria from "@/components/painel/PainelAuditoria";
import { auditoriaDoGestor } from "@/lib/painel/dados";
import { chaveDia } from "@/lib/painel/formato";

export const metadata = { title: "Auditoria" };

export default async function AuditoriaGestorPage() {
  const { casas, registros, acoes } = await auditoriaDoGestor();
  const diaHoje = chaveDia(new Date());

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Auditoria e transparência
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Acompanhe a integridade de horário dos cuidados e o histórico imutável de todas as
          ações feitas nas suas casas.
        </p>
      </header>

      {casas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="mx-auto size-8 text-brand-strong" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Cadastre uma casa primeiro
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Assim que sua instituição estiver cadastrada, todos os registros de cuidados e
            alterações da gestão passam a aparecer aqui.
          </p>
          <Link
            href="/gerente/casas/nova"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Cadastrar casa
          </Link>
        </div>
      ) : (
        <PainelAuditoria
          casas={casas}
          registros={registros}
          acoes={acoes}
          diaHoje={diaHoje}
        />
      )}
    </div>
  );
}
