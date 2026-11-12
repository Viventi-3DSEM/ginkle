import type { Metadata } from "next";
import CasasDirectory from "./CasasDirectory";
import { listarIlpis } from "@/lib/ilpi/dados";

export const metadata: Metadata = {
  title: "Casas de repouso · Ginkle",
  description:
    "Compare instituições de longa permanência para idosos em Praia Grande, Santos e região: estrutura, avaliações e mensalidades.",
};

// O catálogo sai do banco: revalida a cada 10 minutos em vez de a cada request.
export const revalidate = 600;

export default async function CasasPage() {
  const casas = await listarIlpis();
  return <CasasDirectory casas={casas} />;
}