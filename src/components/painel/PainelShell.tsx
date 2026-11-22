"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Globe, LayoutDashboard, LogOut, Tag, UserCog, Users } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { sair } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/gerente", label: "Painel", curto: "Painel", Icone: LayoutDashboard, exato: true },
  {
    href: "/gerente/casas",
    label: "Minhas casas",
    curto: "Casas",
    Icone: Building2,
    exato: false,
  },
  {
    href: "/gerente/residentes",
    label: "Residentes",
    curto: "Residentes",
    Icone: Users,
    exato: false,
  },
  {
    href: "/gerente/equipe",
    label: "Equipe",
    curto: "Equipe",
    Icone: UserCog,
    exato: false,
  },
  {
    href: "/gerente/planos",
    label: "Planos",
    curto: "Planos",
    Icone: Tag,
    exato: false,
  },
];

type Props = {
  usuario: { nome: string; email: string };
  children: React.ReactNode;
};

export default function PainelShell({ usuario, children }: Props) {
  const pathname = usePathname();
  const ativo = (item: (typeof NAV)[number]) =>
    item.exato ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden border-r border-border bg-card md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <Link href="/gerente" className="flex items-center gap-2 px-6 py-6">
          <Image src="/ginkle-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-heading text-lg font-bold tracking-tight">Ginkle</span>
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
            Gestor
          </span>
        </Link>

        <nav aria-label="Painel" className="flex flex-col gap-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo(item) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                ativo(item)
                  ? "bg-secondary text-brand-strong"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <item.Icone className="size-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          ))}

          <Link
            href="/"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Globe className="size-[18px] shrink-0" aria-hidden="true" />
            Ver o site
          </Link>
        </nav>

        <div className="mt-auto border-t border-border p-3">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-xs font-bold text-brand-strong">
              {usuario.nome.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{usuario.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {usuario.email}
              </span>
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <ThemeToggle />
            <form action={sair}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <LogOut className="size-[18px]" aria-hidden="true" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 md:hidden">
          <Link href="/gerente" className="flex items-center gap-2">
            <Image src="/ginkle-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="font-heading text-base font-bold tracking-tight">Ginkle</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              aria-label="Ver o site"
              className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Globe className="size-4" aria-hidden="true" />
            </Link>
            <ThemeToggle />
            <form action={sair}>
              <button
                type="submit"
                aria-label="Sair"
                className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-6 md:px-8 md:pb-14 md:pt-10">
          {children}
        </main>
      </div>

      <nav
        aria-label="Painel"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo(item) ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 text-[0.68rem] font-medium transition-colors",
              ativo(item) ? "text-brand-strong" : "text-muted-foreground",
            )}
          >
            <item.Icone className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate">{item.curto}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
