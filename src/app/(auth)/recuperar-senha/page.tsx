"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { recuperarSenha, type Estado } from "../actions";

const inputClass =
  "w-full border-b border-input bg-transparent py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export default function RecuperarSenha() {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(recuperarSenha, {});
  const [email, setEmail] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="rounded-sm bg-card p-8 sm:p-10">
        <h1 className="font-heading text-3xl font-semibold">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Informe o e-mail da sua conta. Enviamos um link para você criar uma senha
          nova.
        </p>

        <form action={acao} className="mt-8 space-y-6" noValidate>
          <div>
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando && <Loader2 className="size-4 animate-spin" />}
            Enviar link
          </button>

          {estado.ok ? (
            <p
              role="status"
              className="border-l-2 border-brand-strong bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground"
            >
              {estado.ok}
            </p>
          ) : null}

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
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-brand-strong hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}