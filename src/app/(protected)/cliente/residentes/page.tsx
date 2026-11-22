import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import ResidenteCard from "@/components/portal/ResidenteCard";
import { portalDoFamiliar } from "@/lib/portal/dados";

export const metadata = { title: "Residentes" };

export default async function ResidentesPage() {
  const { residentes, resumo } = await portalDoFamiliar();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Residentes vinculados
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {residentes.length === 0
            ? "Nenhum residente vinculado à sua conta ainda."
            : `${residentes.length} residente${residentes.length === 1 ? "" : "s"} vinculado${residentes.length === 1 ? "" : "s"}, com ${resumo.registros7d} registro${resumo.registros7d === 1 ? "" : "s"} nos últimos sete dias.`}
        </p>
      </header>

      {residentes.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <HeartHandshake className="mx-auto size-8 text-brand-strong" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Aguardando vínculo com uma instituição
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Assim que a casa de repouso vincular sua conta a um residente, ele aparece nesta
            lista com acesso ao prontuário e à linha do tempo de cuidados.
          </p>
          <Link
            href="/casas"
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explorar casas de repouso
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {residentes.map((residente) => (
            <li key={residente.id}>
              <ResidenteCard residente={residente} heading="h2" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
