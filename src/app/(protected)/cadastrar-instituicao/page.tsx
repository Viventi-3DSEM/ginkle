import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogOut } from "lucide-react";
import CasaForm from "@/components/painel/CasaForm";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { sair } from "@/app/(auth)/actions";
import { criarCasa } from "@/lib/painel/actions";
import { painelDoGestor } from "@/lib/painel/dados";

export const metadata = { title: "Cadastrar instituição" };

// Porta de entrada do gestor: qualquer pessoa logada pode cadastrar a primeira
// casa. É a RPC criar_ilpi() que transforma essa pessoa em GESTOR.
export default async function CadastrarInstituicaoPage() {
  const { casas } = await painelDoGestor();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
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

      <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
        {casas.length > 0 ? (
          <Link
            href="/gerente"
            className="mb-6 flex items-center justify-between gap-3 rounded-sm border border-border bg-card px-5 py-4 text-sm transition-colors hover:border-brand-strong/50"
          >
            <span className="text-muted-foreground">
              Você já gerencia {casas.length === 1 ? "uma casa" : `${casas.length} casas`}.
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-medium text-brand-strong">
              Ir para o painel
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </Link>
        ) : null}

        <CasaForm
          acao={criarCasa}
          titulo="Cadastre sua instituição"
          subtitulo="Preencha os dados principais da casa. Depois você pode adicionar planos, fotos e equipe."
          rotulo="Cadastrar instituição"
          voltarPara="/"
        />
      </main>
    </div>
  );
}
