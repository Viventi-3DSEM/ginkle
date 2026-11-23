import type { Metadata } from "next";
import Link from "next/link";
import FormNovoRegistro from "@/components/funcionario/FormNovoRegistro";
import { dadosParaNovoRegistro, type TipoRegistro } from "@/lib/funcionario/dados";

export const metadata: Metadata = { title: "Novo registro" };

const TIPOS_VALIDOS = new Set<TipoRegistro>([
  "CUIDADO",
  "MEDICAMENTO",
  "SINAL_VITAL",
  "OCORRENCIA",
]);

export default async function NovoRegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ residente?: string; tipo?: string }>;
}) {
  const [params, dados] = await Promise.all([searchParams, dadosParaNovoRegistro()]);

  const tipoParam = (params.tipo ?? "").toUpperCase() as TipoRegistro;
  const tipoInicial = TIPOS_VALIDOS.has(tipoParam) ? tipoParam : undefined;
  const residenteInicial = params.residente?.trim() || undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/funcionario"
          className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Voltar ao turno
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Novo registro assistencial
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lance cuidados, medicamentos, sinais vitais ou ocorrências. Funciona mesmo sem internet:
          o aparelho guarda o registro e sincroniza ao reconectar.
        </p>
      </header>

      <FormNovoRegistro
        key={`${residenteInicial ?? ""}-${tipoInicial ?? ""}`}
        dados={dados}
        residenteInicial={residenteInicial}
        tipoInicial={tipoInicial}
      />
    </div>
  );
}
