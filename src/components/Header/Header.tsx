"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, X } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre nós" },
  { href: "/casas", label: "Casas de repouso" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [painelHref, setPainelHref] = useState<string | null>(null);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Verifica sessão no cliente para não quebrar o cache ISR das páginas públicas.
  useEffect(() => {
    if (!supabaseConfigurado()) return;
    let ativo = true;
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const uid = data.session?.user?.id;
        if (!ativo) return;
        if (!uid) {
          setPainelHref(null);
          return;
        }
        const { data: vinculos } = await supabase
          .from("vinculo_ilpi")
          .select("cargo")
          .eq("id_usuario", uid)
          .eq("ativo", true);
        if (!ativo) return;
        const cargos = (vinculos ?? []).map((v) => v.cargo as string);
        if (cargos.includes("GESTOR")) setPainelHref("/gerente");
        else if (cargos.includes("FUNCIONARIO")) setPainelHref("/home-funcionario");
        else setPainelHref("/cliente");
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const overlay = isHome && !scrolled && !open;
  const linkAtivo = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "top-0 z-50 w-full border-b transition-colors duration-300",
        isHome ? "fixed inset-x-0" : "sticky",
        overlay
          ? "border-transparent bg-transparent"
          : "border-border/70 bg-background",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2"
        >
          <Image
            src="/ginkle-mark.svg"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7"
          />
          <span
            className={cn(
              "font-heading text-xl font-bold tracking-tight transition-colors duration-300",
              overlay ? "text-[#f4f8f4]" : "text-foreground",
            )}
          >
            Ginkle
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={linkAtivo(item.href) ? "page" : undefined}
              className={cn(
                "text-sm transition-colors",
                linkAtivo(item.href)
                  ? overlay
                    ? "font-medium text-white"
                    : "font-medium text-foreground"
                  : overlay
                    ? "text-white/85 hover:text-white"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle
            className={
              overlay
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : undefined
            }
          />
          {painelHref ? (
            <Link
              href={painelHref}
              className={cn(
                "hidden items-center gap-2 rounded-lg px-4 py-2 font-sans text-sm font-medium transition-opacity hover:opacity-90 sm:inline-flex",
                overlay
                  ? "bg-[#f4f8f4] text-[#174f32]"
                  : "bg-primary text-primary-foreground",
              )}
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Ir para o painel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "hidden px-3 py-2 font-sans text-sm font-medium transition-colors sm:inline-flex",
                  overlay
                    ? "text-white/90 hover:text-white"
                    : "hover:text-brand-strong",
                )}
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className={cn(
                  "hidden rounded-lg px-4 py-2 font-sans text-sm font-medium transition-opacity hover:opacity-90 sm:inline-flex",
                  overlay
                    ? "bg-[#f4f8f4] text-[#174f32]"
                    : "bg-primary text-primary-foreground",
                )}
              >
                Cadastre-se
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg transition-colors md:hidden",
              overlay ? "text-white hover:bg-white/10" : "hover:bg-secondary",
            )}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/70 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {painelHref ? (
              <div className="mt-4 pb-2">
                <Link
                  href={painelHref}
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-sans text-sm font-medium text-primary-foreground"
                >
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Ir para o painel
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 pb-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-sans text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 font-sans text-sm font-medium text-primary-foreground"
                >
                  Cadastre-se
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
