import { notFound } from "next/navigation";
import CasaForm, { type ValoresCasa } from "@/components/painel/CasaForm";
import { atualizarCasa } from "@/lib/painel/actions";
import { casaDoGestor } from "@/lib/painel/dados";

export const metadata = { title: "Editar casa" };

type Props = { params: Promise<{ id: string }> };

export default async function EditarCasaPage({ params }: Props) {
  const { id } = await params;
  const casa = await casaDoGestor(id);
  if (!casa) notFound();

  const valores: ValoresCasa = {
    nome: casa.nome,
    slug: casa.slug,
    cnpj: casa.cnpj,
    telefone: casa.telefone,
    email: casa.email,
    site: casa.site ?? "",
    endereco: casa.endereco,
    cidade: casa.cidade,
    bairro: casa.bairro,
    uf: casa.uf,
    vagas: String(casa.vagas),
    destaque: casa.destaque ?? "",
    tags: casa.tags.join(", "),
    descricao: casa.descricao,
  };

  return (
    <CasaForm
      acao={atualizarCasa}
      idCasa={casa.id}
      valores={valores}
      titulo="Editar casa"
      subtitulo="As mudanças valem na hora no diretório público."
      rotulo="Salvar alterações"
      voltarPara={`/gerente/casas/${casa.id}`}
    />
  );
}
