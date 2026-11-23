"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

export default function ClienteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-sm border border-border bg-card p-8 text-center">
      <p className="font-serif text-sm italic text-danger">Erro ao carregar o portal</p>
      <h1 className="mt-2 font-heading text-xl font-semibold">
        Não foi possível carregar estas informações agora
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Pode ser uma falha temporária de conexão. Tente novamente ou volte para o início do portal.
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
          href="/cliente"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Home className="size-4" aria-hidden="true" />
          Início do portal
        </Link>
      </div>
    </div>
  );
}
