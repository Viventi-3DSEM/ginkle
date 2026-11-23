"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { entrar, entrarDemo, type Estado } from "../actions";

const inputClass =
  "w-full border-b border-input bg-transparent py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

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
  contasDemo?: { papel: string; rotulo: string; nome: string }[];
};

export default function LoginForm({ erroInicial, avisoInicial, destino, contasDemo }: Props) {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(entrar, {});
  const [estadoDemo, acaoDemo, entrandoDemo] = useActionState<Estado, FormData>(entrarDemo, {});
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");

  const ocupado = enviando || entrandoDemo;
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                aria-pressed={showPw}
                aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={ocupado}
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
          <Link
            href={destino ? `/cadastro?next=${encodeURIComponent(destino)}` : "/cadastro"}
            className="font-medium text-brand-strong hover:underline"
          >
            Cadastre-se
          </Link>
        </p>

        {contasDemo?.length ? (
          <div id="demo-login" className="mt-8 border-t border-border pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Contas de demonstração
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Entram direto, sem senha, para apresentação.
            </p>
            <form action={acaoDemo} className="mt-3 grid gap-2">
              {destino ? <input type="hidden" name="next" value={destino} /> : null}
              {contasDemo.map((conta) => (
                <button
                  key={conta.papel}
                  type="submit"
                  name="papel"
                  value={conta.papel}
                  disabled={ocupado}
                  className="flex w-full items-center justify-between gap-3 rounded-sm border border-input px-4 py-2.5 text-left text-sm transition-colors hover:border-brand-strong disabled:opacity-60"
                >
                  <span className="font-medium">{conta.rotulo}</span>
                  <span className="text-xs text-muted-foreground">{conta.nome}</span>
                </button>
              ))}
            </form>
            {estadoDemo.erro ? (
              <p role="alert" className={`${erroClass} mt-3`}>
                {estadoDemo.erro}
              </p>
            ) : null}
          </div>
        ) : null}
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