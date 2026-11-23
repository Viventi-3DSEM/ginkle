"use client";

import Link from "next/link";
import { LayoutDashboard, RotateCcw } from "lucide-react";

export default function GerenteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-sm border border-border bg-card p-8 text-center">
      <p className="font-serif text-sm italic text-danger">Erro ao carregar o painel</p>
      <h1 className="mt-2 font-heading text-xl font-semibold">
        Não foi possível exibir esta seção agora
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Pode ser uma oscilação momentânea de conexão. Tente recarregar a seção ou volte ao início
        do painel.
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
          href="/gerente"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <LayoutDashboard className="size-4" aria-hidden="true" />
          Início do painel
        </Link>
      </div>
    </div>
  );
}
