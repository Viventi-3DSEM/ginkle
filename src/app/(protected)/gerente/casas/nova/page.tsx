import CasaForm from "@/components/painel/CasaForm";
import { criarCasa } from "@/lib/painel/actions";

export const metadata = { title: "Nova casa" };

export default function NovaCasaPage() {
  return (
    <CasaForm
      acao={criarCasa}
      titulo="Cadastrar casa"
      subtitulo="Preencha os dados da instituição. Você pode alterar a visibilidade quando quiser."
      rotulo="Cadastrar casa"
      voltarPara="/gerente/casas"
    />
  );
}
