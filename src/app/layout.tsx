import type { Metadata, Viewport } from "next";
import { Inter, Syne, Lora } from "next/font/google";
import Script from "next/script";
import { RegistroServiceWorker } from "@/components/pwa/RegistroServiceWorker";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ginkle · Gestão e transparência para casas de repouso",
    template: "%s · Ginkle",
  },
  description:
    "O Ginkle organiza a rotina das Instituições de Longa Permanência para Idosos (ILPIs) e aproxima famílias das instituições com transparência e rastreabilidade.",
  appleWebApp: {
    capable: true,
    title: "Ginkle",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#174f32" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1f10" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem("ginkle-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-br"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${syne.variable} ${lora.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Script id="ginkle-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <RegistroServiceWorker />
        {children}
      </body>
    </html>
  );
}
