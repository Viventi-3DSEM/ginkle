"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { alterarSenha, atualizarPerfil, type Estado } from "@/lib/painel/actions";
import { formatarCpf } from "@/lib/validacao/cpf";
import { formatarTelefone } from "@/lib/validacao/telefone";

const inputClass =
  "min-h-11 w-full border-b border-input bg-transparent py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

type PerfilProps = {
  nome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  dataNascimento: string | null;
  hojeIso: string;
};

export function PerfilDadosForm({
  nome,
  email,
  cpf,
  telefone,
  dataNascimento,
  hojeIso,
}: PerfilProps) {
  const [nomeValor, setNomeValor] = useState(nome);
  const [telValor, setTelValor] = useState(telefone ? formatarTelefone(telefone) : "");
  const [nascValor, setNascValor] = useState(dataNascimento ?? "");
  const [estado, acao, salvando] = useActionState<Estado, FormData>(atualizarPerfil, {});

  return (
    <section
      aria-labelledby="perfil-dados-titulo"
      className="rounded-sm border border-border bg-card p-5 sm:p-6"
    >
      <h2 id="perfil-dados-titulo" className="font-heading text-lg font-semibold">
        Dados pessoais
      </h2>

      <form action={acao} className="mt-5 space-y-5">
        <div>
          <label htmlFor="perfil-nome" className={labelClass}>
            Nome completo *
          </label>
          <input
            id="perfil-nome"
            name="nome"
            type="text"
            required
            minLength={3}
            maxLength={120}
            autoComplete="name"
            enterKeyHint="next"
            value={nomeValor}
            onChange={(e) => setNomeValor(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="perfil-telefone" className={labelClass}>
              Telefone
            </label>
            <input
              id="perfil-telefone"
              name="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              value={telValor}
              onChange={(e) => setTelValor(formatarTelefone(e.target.value))}
              placeholder="(13) 99999-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="perfil-nascimento" className={labelClass}>
              Data de nascimento
            </label>
            <input
              id="perfil-nascimento"
              name="dataNascimento"
              type="date"
              autoComplete="bday"
              max={hojeIso}
              enterKeyHint="done"
              value={nascValor}
              onChange={(e) => setNascValor(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 rounded-sm bg-muted/50 p-4 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail de acesso
            </span>
            <p className="mt-1 break-all font-medium text-foreground">{email}</p>
          </div>

          <div>
            <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
              CPF
            </span>
            <p className="mt-1 font-medium text-foreground">
              {cpf ? formatarCpf(cpf) : "Não informado"}
            </p>
          </div>
        </div>

        {estado.erro ? (
          <p
            role="alert"
            className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{estado.erro}</span>
          </p>
        ) : null}

        {estado.ok ? (
          <p
            role="status"
            className="flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-3 py-2 text-xs text-foreground"
          >
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
            <span>{estado.ok}</span>
          </p>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </section>
  );
}

export function AlterarSenhaForm({ email }: { email: string }) {
  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [estado, acao, salvando] = useActionState<Estado, FormData>(
    async (prev, formData) => {
      const res = await alterarSenha(prev, formData);
      if (res.ok) {
        setFormKey((k) => k + 1);
        setMostrarAtual(false);
        setMostrarNova(false);
      }
      return res;
    },
    {},
  );

  return (
    <section
      aria-labelledby="perfil-senha-titulo"
      className="rounded-sm border border-border bg-card p-5 sm:p-6"
    >
      <h2 id="perfil-senha-titulo" className="font-heading text-lg font-semibold">
        Alterar senha
      </h2>

      <form key={formKey} action={acao} className="mt-5 space-y-5">
        {/* Identificador oculto para gerenciadores de senha associarem a troca de senha à conta certa. */}
        <input
          type="email"
          name="username"
          value={email}
          autoComplete="username"
          spellCheck={false}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />

        <div>
          <label htmlFor="perfil-senha-atual" className={labelClass}>
            Senha atual *
          </label>
          <div className="relative">
            <input
              id="perfil-senha-atual"
              name="senhaAtual"
              type={mostrarAtual ? "text" : "password"}
              required
              minLength={6}
              autoComplete="current-password"
              enterKeyHint="next"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setMostrarAtual((v) => !v)}
              aria-pressed={mostrarAtual}
              aria-label={mostrarAtual ? "Ocultar senha atual" : "Mostrar senha atual"}
              className="absolute right-0 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {mostrarAtual ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="perfil-nova-senha" className={labelClass}>
            Nova senha *
          </label>
          <div className="relative">
            <input
              id="perfil-nova-senha"
              name="novaSenha"
              type={mostrarNova ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              enterKeyHint="done"
              aria-describedby="perfil-nova-senha-dica"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setMostrarNova((v) => !v)}
              aria-pressed={mostrarNova}
              aria-label={mostrarNova ? "Ocultar nova senha" : "Mostrar nova senha"}
              className="absolute right-0 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {mostrarNova ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <p id="perfil-nova-senha-dica" className="mt-1.5 text-xs text-muted-foreground">
            Use pelo menos 6 caracteres.
          </p>
        </div>

        {estado.erro ? (
          <p
            role="alert"
            className="flex items-start gap-2 border-l-2 border-danger px-3 py-2 text-xs text-danger"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{estado.erro}</span>
          </p>
        ) : null}

        {estado.ok ? (
          <p
            role="status"
            className="flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-3 py-2 text-xs text-foreground"
          >
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
            <span>{estado.ok}</span>
          </p>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {salvando ? "Atualizando..." : "Atualizar senha"}
          </button>
        </div>
      </form>
    </section>
  );
}
