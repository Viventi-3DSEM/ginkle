"use client";

import Link from "next/link";
import { ClipboardList, RotateCcw } from "lucide-react";

export default function FuncionarioError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-sm border border-border bg-card p-8 text-center">
      <p className="font-serif text-sm italic text-danger">Erro ao carregar o turno</p>
      <h1 className="mt-2 font-heading text-xl font-semibold">
        Não foi possível carregar estas informações agora
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Se a conexão estiver instável, seus registros salvos offline continuam guardados neste
        aparelho. Tente recarregar ou volte para o início do turno.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
        <Link
          href="/funcionario"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <ClipboardList className="size-4" aria-hidden="true" />
          Início do turno
        </Link>
      </div>
    </div>
  );
}
