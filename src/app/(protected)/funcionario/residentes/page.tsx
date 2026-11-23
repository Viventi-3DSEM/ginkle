import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardPlus } from "lucide-react";
import BannerFilaOffline from "@/components/funcionario/BannerFilaOffline";
import ListaResidentesTurno from "@/components/funcionario/ListaResidentesTurno";
import { residentesDoFuncionario } from "@/lib/funcionario/dados";

export const metadata: Metadata = { title: "Residentes do turno" };

export default async function ResidentesFuncionarioPage() {
  const { casas, residentes } = await residentesDoFuncionario();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Residentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte observações médicas, contatos da família e lance registros rapidamente.
          </p>
        </div>

        <Link
          href="/funcionario/novo-registro"
          className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ClipboardPlus className="size-4" aria-hidden="true" />
          Novo registro
        </Link>
      </header>

      <BannerFilaOffline />

      <ListaResidentesTurno casas={casas} residentes={residentes} />
    </div>
  );
}
