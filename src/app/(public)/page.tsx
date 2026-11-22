"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Clock,
  FileText,
  Leaf,
  PhoneOff,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

const registro = [
  {
    hora: "07:00",
    titulo: "Medicação da manhã",
    detalhe: "Dipirona 500 mg, via oral, após o café.",
    badge: "Administrado",
    rubrica: "M. Souza",
  },
  {
    hora: "09:30",
    titulo: "Sinais vitais",
    detalhe: "PA 128/82, FC 74, temperatura 36,4 °C.",
    rubrica: "A. Lima",
  },
  {
    hora: "11:00",
    titulo: "Boletim para a família",
    detalhe: "Foto do café e recado do dia enviados à filha.",
    anexo: true,
  },
  {
    hora: "15:00",
    titulo: "Fisioterapia",
    detalhe: "Sessão de mobilidade concluída, 40 minutos.",
    rubrica: "A. Lima",
  },
  {
    hora: "19:00",
    titulo: "Passagem de plantão",
    detalhe: "Turno encerrado e assinado por dois profissionais.",
    rubrica: "M. Souza",
  },
];

const stats = [
  {
    valor: 92.3,
    decimals: 1,
    texto: "usariam um sistema digital para acompanhar um familiar",
  },
  {
    valor: 88.5,
    decimals: 1,
    texto: "querem ver informações de saúde do residente",
  },
  {
    valor: 98.7,
    decimals: 1,
    texto: "preferem acompanhar tudo pelo celular",
  },
];

const problemas = [
  {
    icone: ClipboardList,
    titulo: "Registro manual",
    texto:
      "Anotações espalhadas entre cadernos de plantão, planilhas e grupos de mensagem.",
  },
  {
    icone: ShieldAlert,
    titulo: "Sem rastreabilidade",
    texto:
      "Não se sabe quem administrou o quê, nem a que horas, nem se algo deixou de ser feito.",
  },
  {
    icone: PhoneOff,
    titulo: "Família no escuro",
    texto:
      "A única atualização sobre o dia é a ligação na recepção, quando sobra tempo.",
  },
];

const personas = [
  {
    papel: "Família",
    titulo: "Ver sem invadir",
    texto:
      "Acompanhe a rotina, a medicação e os sinais vitais do seu familiar pelo celular, sem depender de ligações ou visitas.",
    visual: "familia" as const,
  },
  {
    papel: "Cuidador",
    titulo: "Registrar em segundos",
    texto:
      "Uma interface rápida para o turno: cuidado, ocorrência e medicação registrados com o horário certo e o seu nome.",
    visual: "cuidador" as const,
  },
  {
    papel: "Gestor",
    titulo: "Provar o que aconteceu",
    texto:
      "Residentes, equipe e planos organizados, com auditoria de cada registro e relatórios prontos para a fiscalização.",
    visual: "gestor" as const,
  },
];

const recursos = [
  {
    icone: Clock,
    titulo: "Linha do tempo de cuidados",
    texto: "Medicação, banho, refeição e sinais vitais em ordem cronológica.",
  },
  {
    icone: FileText,
    titulo: "Prontuário digital",
    texto:
      "Histórico de saúde, alergias, ocorrências e relatórios em um só lugar.",
  },
  {
    icone: ShieldCheck,
    titulo: "Auditoria antifraude",
    texto:
      "Duplo horário, do dispositivo e do servidor, para sinalizar qualquer ocultação.",
  },
  {
    icone: Leaf,
    titulo: "Rotina sem papel",
    texto:
      "Menos burocracia no turno e mais tempo dedicado a quem está sob cuidado.",
  },
];

function formatStat(value: number, decimals: number) {
  return `${value.toFixed(decimals).replace(".", ",")}%`;
}

function PersonaVisual({ tipo }: { tipo: "familia" | "cuidador" | "gestor" }) {
  if (tipo === "familia") {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-3">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] text-muted-foreground">
            Hoje, 07:00
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 font-sans text-[10px] font-medium text-brand-strong">
            Atualizado
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-center gap-2 font-sans text-[11px] text-foreground/90">
            <Check className="size-3 text-brand-strong" aria-hidden="true" />
            Medicação administrada
          </li>
          <li className="flex items-center gap-2 font-sans text-[11px] text-foreground/90">
            <Check className="size-3 text-brand-strong" aria-hidden="true" />
            Pressão 128/82
          </li>
          <li className="flex items-center gap-2 font-sans text-[11px] text-foreground/90">
            <Check className="size-3 text-brand-strong" aria-hidden="true" />
            Recado do dia enviado
          </li>
        </ul>
      </div>
    );
  }

  if (tipo === "cuidador") {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-3">
        <div className="flex items-center justify-between rounded-lg bg-secondary px-2.5 py-1.5">
          <span className="font-sans text-[11px] font-medium text-foreground">
            Registrar cuidado
          </span>
          <ArrowRight className="size-3 text-brand-strong" aria-hidden="true" />
        </div>
        <p className="mt-2 font-sans text-[11px] text-muted-foreground">
          07:00, Dipirona 500 mg
        </p>
        <p className="font-sans text-[11px] text-muted-foreground">
          Rubrica M. Souza
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <ShieldCheck className="size-3 text-brand-strong" aria-hidden="true" />
        Auditoria
      </div>
      <div className="mt-2 space-y-1 font-sans text-[10px] tabular-nums text-foreground/85">
        <p>07:00 · M. Souza</p>
        <p>09:30 · A. Lima</p>
        <p>19:00 · dois registros</p>
      </div>
    </div>
  );
}

export default function Home() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const scope = root.current;
        if (!scope) return;

        const heroImg =
          scope.querySelector<HTMLImageElement>(".hero-media img");

        if (heroImg) {
          gsap.fromTo(
            heroImg,
            { scale: 1.18 },
            { scale: 1.1, duration: 2.4, ease: "power3.out" },
          );
          gsap.to(heroImg, {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        gsap.from(".hero-line", {
          yPercent: 115,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.12,
          delay: 0.15,
        });
        gsap.from(".hero-fade", {
          opacity: 0,
          y: 24,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.55,
        });

        gsap.utils
          .toArray<HTMLElement>("[data-reveal]", scope)
          .forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 26,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            });
          });

        const bandImg =
          scope.querySelector<HTMLImageElement>(".band-media img");
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

        const recordEntries = gsap.utils.toArray<HTMLElement>(
          "[data-record-entry]",
          scope,
        );
        const recordList = recordEntries[0]?.parentElement;

        if (recordList) {
          const setActive = () => {
            const line = window.innerHeight * 0.55;
            let best = 0;
            let bestDist = Infinity;
            recordEntries.forEach((el, i) => {
              const r = el.getBoundingClientRect();
              const dist = Math.abs(r.top + r.height / 2 - line);
              if (dist < bestDist) {
                bestDist = dist;
                best = i;
              }
            });
            recordEntries.forEach((el, i) =>
              el.classList.toggle("is-active", i === best),
            );
          };
          setActive();
          ScrollTrigger.create({
            trigger: recordList,
            start: "top 80%",
            end: "bottom 20%",
            onUpdate: setActive,
            onRefresh: setActive,
            onEnter: setActive,
            onEnterBack: setActive,
          });

          const progress = scope.querySelector<HTMLElement>(".record-progress");
          if (progress) {
            gsap.fromTo(
              progress,
              { scaleY: 0 },
              {
                scaleY: 1,
                transformOrigin: "top center",
                ease: "power3.out",
                scrollTrigger: {
                  trigger: recordList,
                  start: "top 70%",
                  end: "bottom 65%",
                  scrub: true,
                },
              },
            );
          }
        }

        gsap.utils
          .toArray<HTMLElement>("[data-record-entry]", scope)
          .forEach((el) => {
            gsap.from(el, {
              y: 18,
              duration: 0.6,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            });
          });

        gsap.utils.toArray<HTMLElement>("[data-count]", scope).forEach((el) => {
          const target = Number(el.dataset.value ?? "0");
          const decimals = Number(el.dataset.decimals ?? "0");
          const format = (v: number) => formatStat(v, decimals);
          el.textContent = format(0);

          ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => {
              const proxy = { v: 0 };
              gsap.to(proxy, {
                v: target,
                duration: 1.6,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = format(proxy.v);
                },
              });
            },
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
      {/* Hero, fotografia de capa */}
      <section className="hero relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0b1a12] text-[#e4f0e5]">
        <div className="hero-media absolute inset-0">
          <Image
            src="/images/velhos.jpg"
            alt="Um casal de idosos caminhando junto, de costas, ao fim da tarde"
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08140e]/90 via-[#08140e]/35 to-[#08140e]/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08140e]/60 via-transparent to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#08140e]/65 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-12 pt-28">
          <div className="w-full max-w-3xl">
            <h1 className="mt-7 font-heading text-[clamp(2.6rem,7vw,6.4rem)] font-semibold leading-[1.12] tracking-tight">
              <span className="block overflow-hidden">
                <span className="hero-line block">O cuidado de</span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line block">portas abertas</span>
              </span>
            </h1>
            <p className="hero-fade mt-8 max-w-lg text-lg leading-relaxed text-[#e4f0e5]/80">
              Rotina, medicação e sinais vitais registrados por quem cuida, e
              visíveis para quem ama. O Ginkle transforma o dia a dia da casa de
              repouso em um histórico claro, com hora e responsável.
            </p>
            <div className="hero-fade mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-lg bg-[#a3d7a9] px-6 py-3 font-sans text-sm font-medium text-[#0f1f10] transition-colors hover:bg-[#b4d4b8]"
              >
                Começar agora
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/sobre"
                className="group inline-flex items-center gap-2 rounded-lg border border-[#e4f0e5]/20 px-6 py-3 font-sans text-sm font-medium text-[#e4f0e5] transition-colors hover:border-[#e4f0e5]/45 hover:bg-[#e4f0e5]/5"
              >
                Conhecer o Ginkle
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          <div className="hero-fade mt-16 hidden items-center gap-3 font-sans text-[0.68rem] uppercase tracking-[0.2em] text-[#e4f0e5]/55 md:flex">
            Rolar
            <span className="h-8 w-px bg-[#e4f0e5]/35" />
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div>
              <h2
                data-reveal
                className="max-w-4xl font-heading text-[clamp(1.7rem,3.4vw,3rem)] font-medium"
              >
                O cuidado não precisa acontecer de{" "}
                <span className="font-serif italic text-brand-strong">
                  portas fechadas
                </span>
                . O Ginkle transforma o dia a dia da casa de repouso em um
                histórico claro, com hora, responsável e acesso para quem ama.
              </h2>

              <ul className="mt-12 grid gap-4 sm:grid-cols-3">
                {[
                  "Registro com hora e nome",
                  "Família acompanha pelo celular",
                  "Auditoria de cada ação",
                ].map((item) => (
                  <li
                    key={item}
                    data-reveal
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-brand-strong">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    <p className="font-sans text-sm leading-relaxed text-foreground">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa de imagem */}
      <section className="band relative h-[62svh] min-h-[380px] overflow-hidden bg-[#0b1a12] text-[#e4f0e5]">
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
            A família, do lado de dentro
          </p>
          <h2
            data-reveal
            className="mt-4 max-w-2xl font-heading text-[clamp(2rem,4.6vw,4rem)] font-medium leading-[1.12]"
          >
            Cuidar é deixar ver.
          </h2>
        </div>
      </section>

      {/* Prontuário, exemplo de registro */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div>
              <h2
                data-reveal
                className="max-w-2xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl"
              >
                Um dia na casa, do jeito que aconteceu.
              </h2>
              <p
                data-reveal
                className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground"
              >
                Cada linha é um cuidado registrado no Ginkle. A família
                acompanha pelo celular; a instituição guarda a prova.
              </p>

              <div className="mt-14 grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-12">
                <figure className="md:sticky md:top-24 md:self-start">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted">
                    <Image
                      src="/images/velhos2.jpg"
                      alt="Um casal de idosos acompanhando o dia pelo computador"
                      fill
                      sizes="(max-width: 768px) 100vw, 38vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-3 font-serif text-xs italic text-muted-foreground">
                    A família acompanha de onde estiver
                  </figcaption>
                </figure>

                <div
                  data-reveal
                  className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft font-sans text-sm font-semibold text-brand-strong">
                        MS
                      </span>
                      <div>
                        <p className="font-sans text-sm font-semibold text-foreground">
                          Maria Souza
                        </p>
                        <p className="font-sans text-xs text-muted-foreground">
                          Quarto 12, Ala B
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 font-sans text-xs font-medium text-brand-strong">
                      Sinais estáveis
                    </span>
                  </div>

                  <div className="relative mt-2">
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-border"
                      aria-hidden="true"
                    />
                    <span
                      className="record-progress pointer-events-none absolute inset-y-0 left-0 w-0.5 origin-top bg-brand-strong"
                      aria-hidden="true"
                    />
                    <ol>
                      {registro.map((r) => (
                        <li
                          key={r.hora}
                          data-record-entry
                          className="record-entry grid grid-cols-[3.25rem_1fr] gap-3 border-l-2 border-transparent py-4 pl-4"
                        >
                          <span className="font-sans text-xs font-medium tabular-nums text-muted-foreground">
                            {r.hora}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-sans text-sm font-semibold text-foreground">
                                {r.titulo}
                              </p>
                              {r.badge ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-sans text-[11px] font-medium text-brand-strong">
                                  <Check
                                    className="size-3"
                                    aria-hidden="true"
                                  />
                                  {r.badge}
                                </span>
                              ) : null}
                              {r.rubrica ? (
                                <span className="rounded-full border border-input px-2 py-0.5 font-sans text-[11px] text-brand-strong">
                                  rubrica {r.rubrica}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 font-sans text-sm leading-relaxed text-muted-foreground">
                              {r.detalhe}
                            </p>
                            {r.anexo ? (
                              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background/60 p-1.5">
                                <Image
                                  src="/images/famillia.jpg"
                                  alt=""
                                  width={48}
                                  height={36}
                                  className="h-9 w-12 rounded object-cover"
                                />
                                <div>
                                  <p className="font-sans text-[11px] font-medium text-foreground">
                                    foto_do_cafe.jpg
                                  </p>
                                  <p className="font-sans text-[10px] text-muted-foreground">
                                    enviado à família
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                    <p className="inline-flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
                      <ShieldCheck
                        className="size-3.5 text-brand-strong"
                        aria-hidden="true"
                      />
                      Registro auditado, com duplo horário
                    </p>
                    <p className="font-sans text-[11px] text-muted-foreground">
                      Atualizado às 19:04
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema e números */}
      <section className="bg-footer text-footer-foreground">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div>
              <h2
                data-reveal
                className="max-w-3xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl"
              >
                O cuidado acontece.{" "}
                <span className="text-brand">O registro, quase nunca.</span>
              </h2>
              <p
                data-reveal
                className="mt-5 max-w-2xl text-lg leading-relaxed text-footer-muted"
              >
                Prontuário em papel, passagem de plantão no caderno e recados
                por mensagem. Quando algo dá errado, ninguém consegue
                reconstruir o dia, e a família fica sem resposta.
              </p>

              <ul className="mt-12 grid gap-4 sm:grid-cols-3">
                {problemas.map((p) => {
                  const Icone = p.icone;
                  return (
                    <li
                      key={p.titulo}
                      data-reveal
                      className="rounded-2xl border border-border bg-card p-6 text-card-foreground"
                    >
                      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                        <Icone className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 font-heading text-lg font-semibold">
                        {p.titulo}
                      </h3>
                      <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                        {p.texto}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <div
                data-reveal
                className="mt-6 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8"
              >
                <div className="grid gap-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
                  {stats.map((s) => (
                    <div
                      key={s.texto}
                      className="sm:px-6 sm:first:pl-0 sm:last:pr-0"
                    >
                      <p
                        data-count
                        data-value={s.valor}
                        data-decimals={s.decimals}
                        className="font-heading text-4xl font-semibold tabular-nums text-brand-strong sm:text-5xl"
                      >
                        {formatStat(s.valor, s.decimals)}
                      </p>
                      <p className="mt-2 max-w-[16rem] font-sans text-sm leading-relaxed text-muted-foreground">
                        {s.texto}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 border-t border-border pt-4 font-sans text-xs text-muted-foreground">
                  Levantamento próprio com 75 potenciais usuários.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para quem */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div>
              <h2
                data-reveal
                className="max-w-2xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl"
              >
                Três pessoas, o mesmo dia.
              </h2>

              <ul className="mt-12 grid gap-4 lg:grid-cols-3">
                {personas.map((p) => (
                  <li
                    key={p.papel}
                    data-reveal
                    className="flex flex-col rounded-2xl border border-border bg-card p-6"
                  >
                    <span className="w-fit rounded-full bg-secondary px-2.5 py-1 font-sans text-xs font-medium text-brand-strong">
                      {p.papel}
                    </span>
                    <h3 className="mt-4 font-heading text-xl font-semibold">
                      {p.titulo}
                    </h3>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                      {p.texto}
                    </p>
                    <div className="mt-5">
                      <PersonaVisual tipo={p.visual} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="bg-secondary text-foreground">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <div>
            <div>
              <h2
                data-reveal
                className="max-w-2xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl"
              >
                O que fica registrado.
              </h2>

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {recursos.map((r) => {
                  const Icone = r.icone;
                  return (
                    <div
                      key={r.titulo}
                      data-reveal
                      className="rounded-2xl border border-border bg-card p-6 text-card-foreground"
                    >
                      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                        <Icone className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 font-heading text-lg font-semibold">
                        {r.titulo}
                      </h3>
                      <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                        {r.texto}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA, carimbo */}
      <section className="bg-[#7ab07f] text-[#0f1f10]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1fr_auto] md:py-20">
          <div>
            <h2 className="max-w-xl font-heading text-3xl font-semibold sm:text-4xl">
              É dono de uma casa de repouso?
            </h2>
            <p className="mt-4 max-w-lg font-sans text-lg leading-relaxed text-[#0f1f10]/80">
              Cadastre sua instituição, mostre a transparência do seu trabalho e
              conquiste a confiança das famílias.
            </p>
            <Link
              href="/cadastrar-instituicao"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#0f1f10] px-6 py-3 font-sans text-sm font-medium text-[#e4f0e5] transition-opacity hover:opacity-90"
            >
              Fazer parte do Ginkle
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
