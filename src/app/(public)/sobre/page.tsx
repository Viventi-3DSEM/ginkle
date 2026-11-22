"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

const team = [
  { nome: "Kaique Baccas", papel: "Líder · Banco de Dados e Front-end", src: "/images/kaique.jpg" },
  { nome: "Isabela Santos", papel: "Front-end e Design", src: "/images/isabela.jpg" },
  { nome: "Kauan Lima", papel: "Front-end e Banco de Dados", src: "/images/kauan.jpg" },
  { nome: "Murillo de Freitas", papel: "Back-end", src: "/images/murillo.jpg" },
  { nome: "Olavio de Almeida", papel: "Back-end", src: "/images/olavio.jpg" },
];

const objetivos = [
  "Registrar e organizar residentes, profissionais e atividades assistenciais.",
  "Controlar cuidados diários, sinais vitais e administração de medicamentos.",
  "Oferecer um portal de acesso controlado para os familiares.",
  "Garantir rastreabilidade das ações por meio de logs de auditoria.",
  "Disponibilizar uma vitrine pública para descoberta de instituições.",
];

const ods = [
  { n: "ODS 3", t: "Saúde e Bem-Estar", d: "Qualidade de vida e cuidado humanizado na terceira idade." },
  { n: "ODS 10", t: "Redução das Desigualdades", d: "Acesso claro e igualitário à informação para as famílias." },
  { n: "ODS 16", t: "Instituições Eficazes", d: "Transparência, responsabilidade e registros auditáveis." },
];

export default function Sobre() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const scope = root.current;
        if (!scope) return;

        gsap.from(".sobre-line", {
          yPercent: 110,
          duration: 1.1,
          ease: "power4.out",
          delay: 0.1,
        });
        gsap.from(".sobre-fade", {
          opacity: 0,
          y: 22,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.35,
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]", scope).forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 26,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        const bandImg = scope.querySelector<HTMLImageElement>(".band-media img");
        if (bandImg) {
          gsap.fromTo(
            bandImg,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: ".band",
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }

        gsap.utils.toArray<HTMLElement>(".team-card", scope).forEach((el, i) => {
          gsap.from(el, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            delay: (i % 5) * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        const stamp = scope.querySelector<HTMLElement>(".stamp");
        if (stamp) {
          gsap.from(stamp, {
            rotate: -14,
            scale: 1.12,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: stamp, start: "top 90%", once: true },
          });
        }
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <main ref={root} className="flex flex-col">
      {/* Abertura */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-28 md:pb-28 md:pt-32">
          <div>
            <div className="grid items-start gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
              <div>
                <h1 className="font-heading text-[clamp(2.6rem,5.5vw,4.6rem)] font-semibold">
                  <span className="block overflow-hidden">
                    <span className="sobre-line block">Conheça o Ginkle.</span>
                  </span>
                </h1>
                <p className="sobre-fade mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  O Ginkle é um sistema para facilitar o gerenciamento de Instituições
                  de Longa Permanência para Idosos (ILPIs), as casas de repouso. A
                  plataforma centraliza informações e oferece três níveis de acesso: as
                  famílias, que acompanham os residentes; os cuidadores, que registram
                  o dia a dia; e os gestores, que administram a instituição e a equipe.
                </p>
                <div className="sobre-fade mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/cadastro"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-pale"
                  >
                    Fazer parte do Ginkle
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/casas"
                    className="group inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-sans text-sm font-medium text-foreground transition-colors hover:border-brand-strong"
                  >
                    Ver casas de repouso
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>

              <figure className="sobre-fade">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted">
                  <Image
                    src="/images/velhos2.jpg"
                    alt="Um casal de idosos acompanhando o dia pelo computador"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 42vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 font-serif text-xs italic text-muted-foreground">
                  O dia a dia da casa, visível para quem ama
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa de imagem */}
      <section className="band relative h-[60svh] min-h-[360px] overflow-hidden bg-[#0b1a12] text-[#e4f0e5]">
        <div className="band-media absolute inset-0">
          <Image
            src="/images/famillia.jpg"
            alt="Uma família reunida em casa, em um momento de cuidado"
            fill
            sizes="100vw"
            className="scale-[1.15] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08140e]/85 via-[#08140e]/35 to-[#08140e]/20" />
        </div>
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-12">
          <p className="font-serif text-sm italic text-[#e4f0e5]/70">
            nossa proposta
          </p>
          <h2
            data-reveal
            className="mt-4 max-w-3xl font-heading text-[clamp(2rem,4.6vw,4rem)] font-medium leading-[1.12]"
          >
            Confiança não se pede. Se registra.
          </h2>
        </div>
      </section>

      {/* Proposta */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div className="grid items-start gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
              <div data-reveal>
                <h2 className="font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
                  Transparência como forma de cuidado.
                </h2>
                <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-muted-foreground">
                  O Ginkle surgiu da preocupação do grupo com os casos de negligência
                  e maus-tratos contra idosos, e com a dificuldade das famílias em
                  encontrar instituições confiáveis. Acreditamos que o acesso à
                  informação e uma gestão organizada são fundamentais para promover
                  confiança.
                </p>
                <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-muted-foreground">
                  Nossa proposta é oferecer uma ferramenta que facilite a
                  administração das ILPIs e aproxime famílias e instituições,
                  contribuindo para escolhas mais conscientes e para um cuidado mais
                  seguro e responsável.
                </p>
                <blockquote className="mt-10 rounded-2xl border border-border bg-card p-6 font-serif text-xl italic leading-snug text-foreground sm:text-2xl">
                  “O acesso à informação é parte do cuidado, não um extra.”
                </blockquote>
              </div>

              <figure data-reveal>
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted">
                  <Image
                    src="/images/velhos.jpg"
                    alt="Um casal de idosos caminhando junto, de costas, ao fim da tarde"
                    fill
                    sizes="(max-width: 768px) 100vw, 38vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 font-serif text-xs italic text-muted-foreground">
                  O cuidado começa por deixar a família enxergar.
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Objetivos e ODS */}
      <section className="bg-secondary text-foreground">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div data-reveal>
                <h2 className="max-w-2xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
                  O que o sistema se propõe a fazer.
                </h2>

                <ul className="mt-8 grid gap-3">
                  {objetivos.map((o) => (
                    <li
                      key={o}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground"
                    >
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      <p className="font-sans text-sm leading-relaxed">
                        {o}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div data-reveal className="lg:pt-2">
                <h3 className="font-heading text-xl font-semibold">
                  Compromisso com os ODS
                </h3>
                <ul className="mt-6 grid gap-3">
                  {ods.map((o) => (
                    <li
                      key={o.n}
                      className="rounded-2xl border border-border bg-card p-5 text-card-foreground"
                    >
                      <p className="font-sans text-sm font-semibold text-brand-strong">
                        {o.n}
                      </p>
                      <p className="mt-1 font-sans text-base font-medium">
                        {o.t}
                      </p>
                      <p className="mt-1 font-sans text-sm leading-relaxed text-muted-foreground">
                        {o.d}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Time */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div>
              <h2 className="max-w-2xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
                Cinco estudantes, um propósito.
              </h2>
              <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground">
                O Ginkle foi desenvolvido por um grupo de cinco estudantes do curso
                técnico em Desenvolvimento de Sistemas da ETEC de Praia Grande.
              </p>

              <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {team.map((m) => (
                  <li key={m.nome} className="team-card">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted">
                      <Image
                        src={m.src}
                        alt={m.nome}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover"
                      />
                    </div>
                    <h3 className="mt-3 font-sans text-sm font-medium">{m.nome}</h3>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
                      {m.papel}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#7ab07f] text-[#0f1f10]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1fr_auto] md:py-20">
          <div>
            <h2 className="max-w-xl font-heading text-3xl font-semibold sm:text-4xl">
              É dono de uma casa de repouso?
            </h2>
            <p className="mt-4 max-w-lg font-sans text-lg leading-relaxed text-[#0f1f10]/80">
              Faça parte do Ginkle, destaque a transparência do seu espaço e
              conquiste a confiança das famílias.
            </p>
            <Link
              href="/cadastrar-instituicao"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#0f1f10] px-6 py-3 font-sans text-sm font-medium text-[#e4f0e5] transition-opacity hover:opacity-90"
            >
              Cadastre-se
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div
            aria-hidden="true"
            className="stamp mx-auto w-fit -rotate-6 border-2 border-[#0f1f10]/50 px-6 py-5 text-center"
          >
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.22em]">
              Cuidado
              <br />
              registrado
            </p>
            <p className="mt-3 border-t border-[#0f1f10]/40 pt-2 font-sans text-[0.65rem] uppercase tracking-[0.28em] text-[#0f1f10]/70">
              Ginkle · 2026
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
