import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buscarIlpi } from "@/lib/ilpi/dados";
import CasaHero from "./CasaHero";
import CasaInfo from "./CasaInfo";
import CasaAside from "./CasaAside";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const casa = await buscarIlpi(slug);

  if (!casa) return { title: "Casa não encontrada · Ginkle" };

  const local = `${casa.bairro}, ${casa.cidade}`;
  return {
    title: `${casa.nome} · ${local} · Ginkle`,
    description: `${casa.descricao} Fica em ${local}. Mensalidade, vagas e avaliações de famílias no Ginkle.`,
    openGraph: {
      title: `${casa.nome} · ${local}`,
      description: casa.descricao,
      images: [{ url: casa.capaUrl }],
    },
  };
}

export default async function CasaPage({ params }: Props) {
  const { slug } = await params;
  const casa = await buscarIlpi(slug);
  if (!casa) notFound();

  return (
    <main className="flex flex-col bg-background">
      <CasaHero casa={casa} />

      <div className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
          <CasaInfo casa={casa} />
          <CasaAside casa={casa} />
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
          <Link
            href="/casas"
            className="inline-flex items-center gap-2 font-sans text-sm text-muted-foreground transition-colors hover:text-brand-strong"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ver todas as casas
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-sans text-sm font-medium transition-colors hover:bg-secondary"
          >
            Cadastrar minha instituição
          </Link>
        </div>

        <p className="mt-6 font-serif text-xs italic text-muted-foreground">
          Imagens ilustrativas. Dados cadastrais e avaliações são mantidos pelas
          instituições e pelas famílias vinculadas.
        </p>
      </div>
    </main>
  );
}