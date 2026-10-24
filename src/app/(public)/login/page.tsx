
import Link from "next/link";

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#19231d] p-8 sm:p-10">

        <h1 className="mt-8 text-3xl font-bold">Entrar</h1>

        <form className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm">
              E-mail
            </label>
            <input
              id="email"
              type="text"
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-white/15 bg-[#101512] px-4 py-3 outline-none focus:border-green-400"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-2 block text-sm">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              className="w-full rounded-lg border border-white/15 bg-[#101512] px-4 py-3 outline-none focus:border-green-400"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-green-500 py-3 font-semibold text-black transition hover:bg-green-400"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-green-400 hover:underline"
          >
            Cadastre-se
          </Link>
        </p>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-zinc-500 hover:text-white"
        >
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
