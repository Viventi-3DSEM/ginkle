import { redirect } from "next/navigation";

// O painel do gestor passou a morar em /gerente: esta rota fica como apelido.
export default function HomeGerentePage() {
  redirect("/gerente");
}
