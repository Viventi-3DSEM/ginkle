import { redirect } from "next/navigation";

// O portal do familiar passou a morar em /cliente: esta rota fica como apelido.
export default function HomeClientePage() {
  redirect("/cliente");
}
