import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-footer p-10 text-footer-foreground md:flex lg:p-14">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/ginkle-mark.svg"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 brightness-0 invert"
          />
          <span className="font-heading text-xl font-bold tracking-tight">
            Ginkle
          </span>
        </Link>

        <blockquote className="max-w-sm">
          <p className="font-heading text-3xl font-semibold leading-[1.1]">
            O cuidado de portas abertas.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-footer-muted">
            Cada medicação, cada refeição, cada sinal vital, registrado com hora e
            responsável, visível para quem ama.
          </p>
        </blockquote>

        <p className="text-xs uppercase tracking-[0.2em] text-footer-muted/70">
          Registro de cuidados · 2026
        </p>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 md:invisible">
            <Image
              src="/ginkle-mark.svg"
              alt=""
              width={28}
              height={28}
              priority
              className="h-7 w-7"
            />
            <span className="font-heading text-lg font-bold tracking-tight">
              Ginkle
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
