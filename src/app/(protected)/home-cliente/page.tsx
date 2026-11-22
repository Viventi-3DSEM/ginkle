import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, HeartHandshake, LogOut } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { sair } from "@/app/(auth)/actions";

/** Área do familiar. Só a porta de entrada: o portal em si é a próxima etapa. */
export default function HomeCliente() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/ginkle-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
            <span className="font-heading text-lg font-bold tracking-tight">Ginkle</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={sair}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="size-[18px]" aria-hidden="true" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Sua conta está pronta</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Escolha por onde começar. As duas áreas usam o mesmo login.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/cadastrar-instituicao"
            className="group rounded-sm border border-border bg-card p-6 transition-colors hover:border-brand-strong/50"
          >
            <Building2 className="size-6 text-brand-strong" aria-hidden="true" />
            <h2 className="mt-4 font-heading text-lg font-semibold">Sou gestor</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Cadastre a instituição, publique no diretório e organize a equipe e os
              residentes.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong">
              Cadastrar instituição
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>

          <div className="rounded-sm border border-dashed border-border bg-card p-6">
            <HeartHandshake className="size-6 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 font-heading text-lg font-semibold">Sou familiar</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Acompanhar a rotina do residente, conversar com a casa e avaliar chega na
              próxima etapa do projeto.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Quer ver as casas antes?{" "}
          <Link href="/casas" className="font-medium text-brand-strong hover:underline">
            Abrir o diretório
          </Link>
        </p>
      </main>
    </div>
  );
}
