import { redirect } from "next/navigation";
import PortalShell from "@/components/portal/PortalShell";
import { usuarioDoPortal } from "@/lib/portal/dados";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await usuarioDoPortal();
  if (!usuario) redirect("/login?next=/cliente");

  return <PortalShell usuario={usuario}>{children}</PortalShell>;
}
