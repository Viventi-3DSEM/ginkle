"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { redefinirSenha, type Estado } from "../actions";

const inputClass =
  "w-full border-b border-input bg-transparent py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export default function RedefinirSenha() {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(redefinirSenha, {});
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="w-full max-w-md">
      <div className="rounded-sm bg-card p-8 sm:p-10">
        <h1 className="font-heading text-3xl font-semibold">Nova senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Escolha a nova senha da sua conta. Depois de salvar, você entra com ela.
        </p>

        <form action={acao} className="mt-8 space-y-6" noValidate>
          <div>
            <label htmlFor="senha" className={labelClass}>
              Nova senha
            </label>
            <div className="relative">
              <input
                id="senha"
                name="senha"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Pelo menos 6 caracteres"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmar" className={labelClass}>
              Confirmar senha
            </label>
            <input
              id="confirmar"
              name="confirmar"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando && <Loader2 className="size-4 animate-spin" />}
            Salvar nova senha
          </button>

          {estado.erro ? (
            <p
              role="alert"
              className="border-l-2 border-danger bg-card px-4 py-3 text-xs leading-relaxed text-danger"
            >
              {estado.erro}
            </p>
          ) : null}
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          Link expirado?{" "}
          <Link
            href="/recuperar-senha"
            className="font-medium text-brand-strong hover:underline"
          >
            Pedir outro
          </Link>
        </p>
      </div>
    </div>
  );
}