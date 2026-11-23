import type { Metadata } from "next";
import ChatEquipe from "@/components/funcionario/ChatEquipe";
import { chatDaEquipe } from "@/lib/funcionario/dados";

export const metadata: Metadata = { title: "Chat e suporte" };

export default async function ChatFuncionarioPage() {
  const dados = await chatDaEquipe();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Chat e suporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Responda às mensagens dos familiares e mantenha a comunicação do turno centralizada.
        </p>
      </header>

      <ChatEquipe dados={dados} />
    </div>
  );
}
