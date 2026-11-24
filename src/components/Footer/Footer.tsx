import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto bg-footer text-footer-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/ginkle-mark.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="font-heading text-xl font-bold tracking-tight text-footer-foreground">
              Ginkle
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-footer-muted">
            Gestão assistencial e transparência para Instituições de Longa
            Permanência para Idosos.
          </p>
        </div>

        <nav aria-label="Plataforma">
          <h2 className="font-sans text-sm font-semibold text-footer-foreground">
            Plataforma
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-footer-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-footer-foreground">
                Início
              </Link>
            </li>
            <li>
              <Link href="/casas" className="transition-colors hover:text-footer-foreground">
                Casas de repouso
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="transition-colors hover:text-footer-foreground">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link href="/cadastro" className="transition-colors hover:text-footer-foreground">
                Cadastre-se
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Para instituições">
          <h2 className="font-sans text-sm font-semibold text-footer-foreground">
            Para instituições
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-footer-muted">
            <li>
              <Link
                href="/cadastrar-instituicao"
                className="transition-colors hover:text-footer-foreground"
              >
                Cadastrar instituição
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-footer-foreground">
                Acessar painel
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="transition-colors hover:text-footer-foreground">
                Transparência e proposta
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-sans text-sm font-semibold text-footer-foreground">
            Fale com a gente
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-footer-muted">
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <a
                href="mailto:contato@ginkle.me"
                className="transition-colors hover:text-footer-foreground"
              >
                contato@ginkle.me
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              Praia Grande · SP · ETEC Praia Grande
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-footer-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Ginkle. Projeto de TCC, ETEC Praia Grande.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/termos" className="transition-colors hover:text-footer-foreground">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-footer-foreground">
              Privacidade
            </Link>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span>Grupo Viventi · ODS 3, 10 e 16</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

