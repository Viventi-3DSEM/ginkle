import type { Metadata } from "next";
import CadastroForm from "./CadastroForm";
import { destinoSeguro } from "@/lib/auth/destino";
import { slugValido } from "@/lib/validacao/slug";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Ginkle para acompanhar cuidados ou solicitar entrada em uma casa.",
};

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ casa?: string; next?: string }>;
}) {
  const params = await searchParams;
  const casaSlug = params.casa?.trim();
  const destino =
    casaSlug && slugValido(casaSlug)
      ? `/cliente/solicitacoes?casa=${encodeURIComponent(casaSlug)}`
      : (destinoSeguro(params.next) ?? undefined);

  return <CadastroForm destino={destino} />;
}
