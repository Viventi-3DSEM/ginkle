"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { entrar, type Estado } from "../actions";

const inputClass =
  "w-full border-b border-input bg-transparent py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

const avisoClass =
  "border-l-2 border-brand-strong bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground";

const erroClass =
  "border-l-2 border-danger bg-card px-4 py-3 text-xs leading-relaxed text-danger";

type Props = {
  erroInicial?: string;
  avisoInicial?: string;
  destino?: string;
};

export default function LoginForm({ erroInicial, avisoInicial, destino }: Props) {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(entrar, {});
  const [showPw, setShowPw] = useState(false);

  const aviso = estado.ok ?? avisoInicial;
  const erro = estado.erro ?? erroInicial;

  return (
    <div className="w-full max-w-md">
      <div className="rounded-sm bg-card p-8 sm:p-10">
        <h1 className="font-heading text-3xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesse sua conta para continuar.
        </p>

        <form action={acao} className="mt-8 space-y-6" noValidate>
          {destino ? <input type="hidden" name="next" value={destino} /> : null}

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
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="senha" className={labelClass}>
                Senha
              </label>
              <Link
                href="/recuperar-senha"
                className="mb-1 text-xs text-muted-foreground underline-offset-4 hover:text-brand-strong hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <input
                id="senha"
                name="senha"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
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

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </button>

          {erro ? (
            <p role="alert" className={erroClass}>
              {erro}
            </p>
          ) : null}

          {aviso ? (
            <p role="status" className={avisoClass}>
              {aviso}
            </p>
          ) : null}
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-brand-strong hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>

      <Link
        href="/"
        className="mt-6 block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Voltar para o início
      </Link>
    </div>
  );
}