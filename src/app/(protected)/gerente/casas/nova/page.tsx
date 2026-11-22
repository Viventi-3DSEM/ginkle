import CasaForm from "@/components/painel/CasaForm";
import { criarCasa } from "@/lib/painel/actions";

export const metadata = { title: "Nova casa" };

export default function NovaCasaPage() {
  return (
    <CasaForm
      acao={criarCasa}
      titulo="Cadastrar casa"
      subtitulo="A casa entra no ar no diretório assim que você salvar. Dá para deixar em rascunho depois, na página dela."
      rotulo="Cadastrar casa"
      voltarPara="/gerente/casas"
    />
  );
}
