"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ClipboardPlus,
  CloudOff,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  User,
  Users,
  Wifi,
} from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LinkPendingHint from "@/components/nav/LinkPendingHint";
import { sair } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { OfflineProvider, useOffline } from "./OfflineProvider";

const NAV = [
  { href: "/funcionario", label: "Turno", curto: "Turno", Icone: ClipboardList, exato: true },
  {
    href: "/funcionario/residentes",
    label: "Residentes",
    curto: "Residentes",
    Icone: Users,
    exato: false,
  },
  {
    href: "/funcionario/novo-registro",
    label: "Novo registro",
    curto: "Registrar",
    Icone: ClipboardPlus,
    exato: false,
    destaque: true,
  },
  {
    href: "/funcionario/historico",
    label: "Histórico",
    curto: "Histórico",
    Icone: History,
    exato: false,
  },
  {
    href: "/funcionario/perfil",
    label: "Perfil",
    curto: "Perfil",
    Icone: User,
    exato: false,
  },
];

type Props = {
  usuario: {
    id: string;
    nome: string;
    email: string;
    avatarUrl?: string | null;
    ehGestor: boolean;
  };
  children: React.ReactNode;
};

function StatusConexao({ compacto = false }: { compacto?: boolean }) {
  const { online, pendentes, sincronizando, sincronizarFila } = useOffline();
  const qtd = pendentes.length;

  if (!online) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-warning/15 font-medium text-warning",
          compacto ? "px-2 py-1 text-[0.68rem]" : "w-full justify-center px-3 py-1.5 text-xs",
        )}
      >
        <CloudOff className="size-3.5 shrink-0" aria-hidden="true" />
        <span>Offline{qtd > 0 ? ` · ${qtd}` : ""}</span>
      </span>
    );
  }

  if (qtd > 0) {
    return (
      <button
        type="button"
        onClick={() => void sincronizarFila()}
        disabled={sincronizando}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-info/15 font-medium text-info transition-opacity hover:opacity-85 disabled:opacity-60",
          compacto ? "px-2.5 py-1 text-[0.68rem]" : "w-full justify-center px-3 py-1.5 text-xs",
        )}
      >
        <RefreshCw
          className={cn("size-3.5 shrink-0", sincronizando && "animate-spin")}
          aria-hidden="true"
        />
        <span>
          {sincronizando
            ? "Sincronizando..."
            : `${qtd} ${qtd === 1 ? "pendente" : "pendentes"}`}
        </span>
      </button>
    );
  }

  if (compacto) return null;

  return (
    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-brand-strong">
      <Wifi className="size-3.5 shrink-0" aria-hidden="true" />
      <span>Conectado · sincronizado</span>
    </span>
  );
}

function ShellConteudo({ usuario, children }: Props) {
  const pathname = usePathname();
  const ativo = (item: (typeof NAV)[number]) =>
    item.exato ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-background md:flex">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Pular para o conteúdo principal
      </a>

      <aside className="hidden border-r border-border bg-card md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <Link href="/funcionario" className="flex shrink-0 items-center gap-2 px-6 py-6">
          <Image src="/ginkle-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-heading text-lg font-bold tracking-tight">Ginkle</span>
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
            Equipe
          </span>
        </Link>

        <div className="px-4 pb-3">
          <StatusConexao />
        </div>

        <nav aria-label="Painel do funcionário" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo(item) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                ativo(item)
                  ? "bg-secondary text-brand-strong"
                  : item.destaque
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <item.Icone className="size-[18px] shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              <LinkPendingHint className="ml-auto" />
            </Link>
          ))}

          {usuario.ehGestor ? (
            <Link
              href="/gerente"
              className="mt-2 flex items-center gap-3 rounded-sm border-t border-border px-3 pb-2.5 pt-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <LayoutDashboard className="size-[18px] shrink-0" aria-hidden="true" />
              <span>Painel do gestor</span>
              <LinkPendingHint className="ml-auto" />
            </Link>
          ) : null}

          <Link
            href="/"
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Globe className="size-[18px] shrink-0" aria-hidden="true" />
            Ver o site
          </Link>
        </nav>

        <div className="mt-auto border-t border-border p-3">
          <Link
            href="/funcionario/perfil"
            className={cn(
              "flex items-center gap-2 rounded-sm px-3 py-2 transition-colors",
              pathname.startsWith("/funcionario/perfil")
                ? "bg-secondary/70"
                : "hover:bg-secondary/50",
            )}
          >
            {usuario.avatarUrl ? (
              <Image
                src={usuario.avatarUrl}
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft font-heading text-xs font-bold text-brand-strong">
                {usuario.nome.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{usuario.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {usuario.email}
              </span>
            </span>
          </Link>
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
        <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 md:hidden">
          <Link href="/funcionario" className="flex items-center gap-2">
            <Image src="/ginkle-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="font-heading text-base font-bold tracking-tight">Ginkle</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <StatusConexao compacto />
            {usuario.ehGestor ? (
              <Link
                href="/gerente"
                aria-label="Ir para o painel do gestor"
                className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LayoutDashboard className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
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

        <main
          id="conteudo-principal"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-6 outline-none md:px-8 md:pb-14 md:pt-10"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Atalhos do turno"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo(item) ? "page" : undefined}
            className={cn(
              "relative flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 text-[0.68rem] font-medium transition-colors",
              ativo(item)
                ? "text-brand-strong"
                : item.destaque
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            <LinkPendingHint className="absolute right-2 top-2" />
            <item.Icone className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate">{item.curto}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function FuncionarioShell(props: Props) {
  return (
    <OfflineProvider usuarioId={props.usuario.id}>
      <ShellConteudo {...props} />
    </OfflineProvider>
  );
}
