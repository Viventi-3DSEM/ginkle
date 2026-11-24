import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  MapPin,
  MessageSquare,
  ShieldCheck,
  WifiOff,
} from "lucide-react";

const capacidades = [
  {
    icone: ClipboardList,
    titulo: "Registros assistenciais no plantão",
    texto:
      "Lance cuidados, medicamentos, sinais vitais e ocorrências em poucos toques, com as observações médicas do residente visíveis antes do envio.",
  },
  {
    icone: WifiOff,
    titulo: "Funciona mesmo sem internet",
    texto:
      "Se o sinal cair durante o turno, o registro continua sendo salvo no aparelho e é enviado automaticamente assim que a conexão volta.",
  },
  {
    icone: ShieldCheck,
    titulo: "Histórico auditável",
    texto:
      "Cada lançamento guarda quem registrou, o horário do turno e o momento da sincronização, com sinalização de atrasos e exportação em planilha.",
  },
  {
    icone: MessageSquare,
    titulo: "Acompanhamento e chat com a família",
    texto:
      "Familiares vinculados acompanham o dia a dia do residente em ordem cronológica e conversam diretamente com a equipe da instituição em tempo real.",
  },
  {
    icone: Building2,
    titulo: "Gestão completa da instituição",
    texto:
      "Administre uma ou mais unidades em um só painel: equipe, escala de turnos, residentes, vínculos familiares, planos, assinaturas e faturas.",
  },
  {
    icone: MapPin,
    titulo: "Vitrine pública de descoberta",
    texto:
      "Publique sua casa no diretório com fotos, vagas e mensalidades, receba solicitações de entrada e reúna avaliações feitas apenas por famílias vinculadas.",
  },
];

const perfis = [
  {
    numero: "01",
    papel: "Família",
    titulo: "Acompanhar sem depender de ligações",
    texto:
      "Veja como foi o dia do seu familiar direto pelo celular, com clareza sobre cuidados, horários e quem acompanhou cada etapa.",
    pontos: [
      "Linha do tempo diária filtrada por tipo de cuidado",
      "Chat em tempo real com a equipe da instituição",
      "Solicitações de entrada, faturas e avaliação da casa",
    ],
  },
  {
    numero: "02",
    papel: "Cuidador",
    titulo: "Registrar no ritmo do plantão",
    texto:
      "Interface direta para o turno, pensada para o celular e pronta para operar mesmo em locais com sinal instável.",
    pontos: [
      "Lançamento guiado de cuidados, medicamentos, sinais e ocorrências",
      "Continuidade offline com envio automático ao reconectar",
      "Consulta à escala de turnos, histórico e aprovações",
    ],
  },
  {
    numero: "03",
    papel: "Gestor",
    titulo: "Operação organizada e rastreável",
    texto:
      "Visão consolidada de toda a operação para coordenar a equipe, acompanhar mensalidades e manter o histórico pronto para consulta.",
    pontos: [
      "Gestão de uma ou mais casas, equipe e escala de plantões",
      "Cadastro de residentes, vínculos familiares, planos e financeiro",
      "Auditoria com duplo horário, alertas de atraso e exportação",
    ],
  },
];

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col overflow-hidden bg-photo text-photo-fg">
        <div className="absolute inset-0">
          <Image
            src="/images/velhos.jpg"
            alt="Um casal de idosos caminhando junto, de costas, ao fim da tarde"
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-photo-scrim/90 via-photo-scrim/40 to-photo-scrim/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-photo-scrim/65 via-transparent to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-photo-scrim/65 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-14 pt-28 md:pb-20">
          <div className="w-full max-w-3xl">
            <h1 className="rise font-heading text-[clamp(2.6rem,6.8vw,5.8rem)] font-semibold leading-[1.08] tracking-tight">
              O cuidado de
              <br />
              portas abertas
            </h1>
            <p className="rise rise-late mt-7 max-w-xl text-lg leading-relaxed text-photo-fg/85">
              Gestão assistencial para casas de repouso. Registre a rotina no
              plantão, organize a operação da instituição e dê visibilidade real
              às famílias.
            </p>
            <div className="rise rise-later mt-9 flex flex-wrap items-center gap-3.5">
              <Link
                href="/cadastrar-instituicao"
                className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-photo-cta px-6 py-3 font-sans text-sm font-semibold text-photo-cta-ink transition-colors hover:bg-photo-cta-hover"
              >
                Cadastrar instituição
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/casas"
                className="group inline-flex min-h-11 items-center gap-2 rounded-sm border border-photo-fg/25 px-6 py-3 font-sans text-sm font-medium text-photo-fg transition-colors hover:border-photo-fg/50 hover:bg-photo-fg/10"
              >
                Explorar casas
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* O produto na prática */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="font-serif text-sm italic text-brand-strong">
              A plataforma
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Tudo o que a rotina da casa precisa, no mesmo lugar.
            </h2>
            <p className="mt-5 font-sans text-base leading-relaxed text-muted-foreground sm:text-lg">
              Do lançamento feito durante o plantão ao acompanhamento da
              família, cada etapa fica organizada, rastreável e pronta para
              consulta.
            </p>
          </div>

          <ul className="mt-14 grid gap-x-10 gap-y-12 border-t border-border pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {capacidades.map((item) => {
              const Icone = item.icone;
              return (
                <li key={item.titulo} className="flex flex-col">
                  <span className="flex size-10 items-center justify-center rounded-sm bg-secondary text-brand-strong">
                    <Icone className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                    {item.titulo}
                  </h3>
                  <p className="mt-2.5 font-sans text-sm leading-relaxed text-muted-foreground">
                    {item.texto}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Três perfis na mesma rotina */}
      <section className="bg-footer text-footer-foreground">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="font-serif text-sm italic text-brand">
              Perfis de acesso
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Três perfis na mesma rotina.
            </h2>
            <p className="mt-5 font-sans text-base leading-relaxed text-footer-muted sm:text-lg">
              Cada pessoa acessa exatamente o que precisa no dia a dia, sem
              duplicar trabalho nem expor dados indevidos.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 border-t border-footer-foreground/15 pt-12 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-footer-foreground/15">
            {perfis.map((p) => (
              <li
                key={p.papel}
                className="flex flex-col lg:px-8 lg:first:pl-0 lg:last:pr-0"
              >
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                  <span className="tabular-nums">{p.numero}</span> · {p.papel}
                </p>
                <h3 className="mt-4 font-heading text-xl font-semibold text-footer-foreground sm:text-2xl">
                  {p.titulo}
                </h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-footer-muted">
                  {p.texto}
                </p>

                <div className="mt-6 lg:mt-auto lg:pt-6">
                  <ul className="space-y-2.5 border-t border-footer-foreground/12 pt-5 font-sans text-sm text-footer-foreground/90">
                    {p.pontos.map((ponto) => (
                      <li key={ponto} className="flex items-start gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-px w-3 shrink-0 bg-brand"
                        />
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-cta-band text-cta-band-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:py-20">
          <div className="max-w-xl">
            <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
              Leve o Ginkle para a sua instituição.
            </h2>
            <p className="mt-4 font-sans text-base leading-relaxed text-cta-band-ink/80 sm:text-lg">
              Cadastre sua casa de repouso, organize a rotina da equipe e
              apresente seu trabalho com clareza para as famílias.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/cadastrar-instituicao"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm bg-cta-band-ink px-6 py-3 font-sans text-sm font-semibold text-photo-fg transition-opacity hover:opacity-90"
            >
              Cadastrar instituição
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/casas"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm border border-cta-band-ink/35 px-5 py-3 font-sans text-sm font-medium text-cta-band-ink transition-colors hover:bg-cta-band-ink/10"
            >
              Explorar casas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
