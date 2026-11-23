import type { Metadata } from "next";
import CasasDirectory from "./CasasDirectory";
import { listarIlpisComOrigem } from "@/lib/ilpi/dados";

export const metadata: Metadata = {
  title: "Casas de repouso",
  description:
    "Compare instituições de longa permanência para idosos em Praia Grande, Santos e região: estrutura, avaliações e mensalidades.",
};

// O catálogo sai do banco: revalida a cada 10 minutos em vez de a cada request.
export const revalidate = 600;

export default async function CasasPage() {
  const { casas, demo } = await listarIlpisComOrigem();
  return <CasasDirectory casas={casas} demo={demo} />;
}