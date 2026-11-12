"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cadastrar, type Estado } from "../actions";
import { formatarCpf } from "@/lib/validacao/cpf";
import { formatarTelefone } from "@/lib/validacao/telefone";

const inputClass =
  "w-full border-b border-input bg-transparent py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export default function Cadastro() {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(cadastrar, {});
  const [showPw, setShowPw] = useState(false);
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");

  if (estado.ok) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-sm bg-card p-8 sm:p-10">
          <h1 className="font-heading text-3xl font-semibold">Confira seu e-mail</h1>
          <p role="status" className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {estado.ok}
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex w-full items-center justify-center rounded-sm bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-sm bg-card p-8 sm:p-10">
        <h1 className="font-heading text-3xl font-semibold">Crie sua conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre-se para conhecer a plataforma.
        </p>

        <form action={acao} className="mt-8 space-y-6" noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nome" className={labelClass}>
                Nome completo
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cpf" className={labelClass}>
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                required
                aria-required="true"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                maxLength={14}
                value={cpf}
                onChange={(e) => setCpf(formatarCpf(e.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="telefone" className={labelClass}>
                Telefone
              </label>
              <input
                id="telefone"
                name="telefone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(13) 99999-0000"
                maxLength={15}
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
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
              <label htmlFor="senha" className={labelClass}>
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  name="senha"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Crie uma senha"
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
                placeholder="Repita a senha"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando && <Loader2 className="size-4 animate-spin" />}
            Criar conta
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
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-brand-strong hover:underline">
            Fazer login
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