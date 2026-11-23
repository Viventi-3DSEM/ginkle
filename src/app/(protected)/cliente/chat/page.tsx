import type { Metadata } from "next";
import ChatFamiliar from "@/components/portal/ChatFamiliar";
import { chatDoFamiliar } from "@/lib/portal/dados";

export const metadata: Metadata = { title: "Chat e suporte" };

export default async function ChatFamiliarPage({
  searchParams,
}: {
  searchParams: Promise<{ casa?: string }>;
}) {
  const [params, dados] = await Promise.all([searchParams, chatDoFamiliar()]);
  const casaInicialId = params.casa?.trim() || undefined;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Chat e suporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Canal direto de mensagens com a equipe das instituições vinculadas ao seu cadastro.
        </p>
      </header>

      <ChatFamiliar key={casaInicialId ?? ""} dados={dados} casaInicialId={casaInicialId} />
    </div>
  );
}
