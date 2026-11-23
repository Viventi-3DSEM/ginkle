"use client";

import Image from "next/image";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-16 text-center">
      <Link href="/" className="inline-flex items-center gap-2">
        <Image src="/ginkle-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
        <span className="font-heading text-lg font-bold tracking-tight">Ginkle</span>
      </Link>

      <div className="mt-8 w-full max-w-md rounded-sm border border-border bg-card p-8 sm:p-10">
        <p className="font-serif text-sm italic text-danger">Algo saiu do esperado</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ocorreu um erro temporário ao buscar os dados. Tente novamente em instantes.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Home className="size-4" aria-hidden="true" />
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
