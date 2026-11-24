import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Condições de uso do Ginkle para gestores, profissionais de cuidado, familiares e visitantes do diretório público de ILPIs.",
};

const ATUALIZADO_EM = "24 de novembro de 2026";

const INDICE = [
  { id: "objeto", titulo: "1. Objeto e escopo da plataforma" },
  { id: "natureza-assistencial", titulo: "2. Natureza não clínica e limites de responsabilidade" },
  { id: "perfis", titulo: "3. Perfis de acesso e responsabilidades" },
  { id: "cadastro-seguranca", titulo: "4. Cadastro, credenciais e uso adequado" },
  { id: "registros-auditoria", titulo: "5. Registros assistenciais, modo offline e auditoria" },
  { id: "diretorio-avaliacoes", titulo: "6. Diretório público, solicitações e avaliações" },
  { id: "financeiro", titulo: "7. Planos, assinaturas e controle financeiro" },
  { id: "propriedade-disponibilidade", titulo: "8. Propriedade intelectual e disponibilidade" },
  { id: "encerramento-foro", titulo: "9. Alterações, encerramento e legislação aplicável" },
];

export default function TermosPage() {
  return (
    <main className="flex flex-col bg-background">
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-14 md:pb-16 md:pt-20">
          <p className="font-serif text-sm italic text-brand-strong">Documentação legal</p>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Termos de uso
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground">
            Estas condições regulam o uso da plataforma Ginkle por visitantes, familiares,
            profissionais de cuidado e Instituições de Longa Permanência para Idosos (ILPIs).
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>Última atualização: {ATUALIZADO_EM}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <Link
              href="/privacidade"
              className="font-medium text-brand-strong transition-colors hover:underline"
            >
              Ler Política de privacidade (LGPD)
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <details className="ginkle-details rounded-sm border border-border bg-card p-4 lg:hidden">
                <summary className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Índice dos termos
                </summary>
                <nav aria-label="Índice dos termos" className="mt-3">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {INDICE.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="transition-colors hover:text-brand-strong"
                        >
                          {item.titulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>

              <nav aria-label="Índice dos termos" className="hidden lg:block">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Nesta página
                </p>
                <ul className="mt-4 space-y-2.5 border-l border-border pl-4 text-sm text-muted-foreground">
                  {INDICE.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block leading-snug transition-colors hover:text-brand-strong"
                      >
                        {item.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <article className="max-w-3xl space-y-10 font-sans text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              <div className="rounded-sm border border-border bg-card p-5 text-xs leading-relaxed text-muted-foreground">
                <p className="font-semibold uppercase tracking-[0.1em] text-foreground">
                  Nota de transparência
                </p>
                <p className="mt-1.5">
                  O Ginkle foi desenvolvido originalmente como projeto acadêmico no curso técnico em
                  Desenvolvimento de Sistemas da ETEC de Praia Grande (Grupo Viventi). Em ambiente
                  de demonstração, os dados exibidos são fictícios e não devem ser usados para
                  armazenar prontuários clínicos reais sem governança jurídica e sanitária própria
                  da instituição.
                </p>
              </div>

              <section id="objeto" className="scroll-mt-24 space-y-3 border-t border-border pt-8 first:border-t-0 first:pt-0">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  1. Objeto e escopo da plataforma
                </h2>
                <p>
                  O Ginkle é uma plataforma web de apoio à gestão operacional, ao registro da rotina
                  assistencial, à comunicação entre equipes e familiares e à descoberta pública de
                  Instituições de Longa Permanência para Idosos (ILPIs).
                </p>
                <p>
                  Ao criar uma conta, cadastrar uma instituição ou utilizar as funcionalidades
                  autenticadas, o usuário declara estar ciente e de acordo com estes Termos de uso e
                  com a{" "}
                  <Link href="/privacidade" className="font-medium text-brand-strong hover:underline">
                    Política de privacidade
                  </Link>
                  .
                </p>
              </section>

              <section id="natureza-assistencial" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  2. Natureza não clínica e limites de responsabilidade
                </h2>
                <p>
                  O Ginkle é uma ferramenta de organização e transparência operacional. A plataforma{" "}
                  <strong className="font-semibold text-foreground">
                    não presta serviços médicos, de enfermagem ou de acolhimento
                  </strong>{" "}
                  e não substitui:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    o prontuário médico-legal e as prescrições reguladas pelos conselhos profissionais
                    competentes (como CFM e COREN);
                  </li>
                  <li>
                    o Plano de Atenção Integral à Saúde do residente nem as obrigações sanitárias
                    exigidas das ILPIs pela{" "}
                    <strong className="font-semibold text-foreground">
                      RDC ANVISA nº 502/2021
                    </strong>{" "}
                    e pelo{" "}
                    <strong className="font-semibold text-foreground">
                      Estatuto da Pessoa Idosa (Lei nº 10.741/2003)
                    </strong>
                    ;
                  </li>
                  <li>
                    canais oficiais de urgência e emergência médica (como SAMU 192 ou serviço de
                    emergência contratado pela instituição).
                  </li>
                </ul>
                <p>
                  Toda decisão assistencial, veracidade das informações registradas e regularidade
                  sanitária, cadastral e contratual são de responsabilidade exclusiva da instituição
                  e dos profissionais que atuam nela.
                </p>
              </section>

              <section id="perfis" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  3. Perfis de acesso e responsabilidades
                </h2>
                <p>
                  O acesso às funcionalidades do Ginkle é definido pelo vínculo ativo da conta com
                  cada instituição:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong className="font-semibold text-foreground">Gestor:</strong> responsável
                    pelos dados cadastrais e públicos da ILPI, pela gestão da equipe e da escala de
                    turnos, pelo cadastro de residentes, pela concessão e revogação de vínculos
                    familiares, pelos planos informados e pela conferência da auditoria. O gestor
                    declara possuir autorização legal para cadastrar a instituição e tratar os dados
                    dos residentes sob seus cuidados.
                  </li>
                  <li>
                    <strong className="font-semibold text-foreground">Funcionário / Cuidador:</strong>{" "}
                    responsável por registrar com fidelidade cuidados, medicamentos, sinais vitais e
                    ocorrências ocorridos em seu turno, respeitar o sigilo das informações dos
                    residentes e utilizar o chat exclusivamente para comunicação institucional.
                  </li>
                  <li>
                    <strong className="font-semibold text-foreground">Familiar:</strong> acessa
                    apenas informações dos residentes aos quais foi formalmente vinculado pela
                    instituição, comprometendo-se a manter a confidencialidade desses dados e a usar
                    os canais de solicitação, chat e avaliação de boa-fé.
                  </li>
                </ul>
              </section>

              <section id="cadastro-seguranca" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  4. Cadastro, credenciais e uso adequado
                </h2>
                <p>
                  As contas são pessoais e intransferíveis. O usuário deve fornecer dados verdadeiros
                  (nome completo, CPF válido e e-mail ativo) e manter sua senha em sigilo. É proibido
                  compartilhar credenciais entre turnos ou colaboradores — a rastreabilidade dos
                  registros depende da identificação individual de quem executou cada ação.
                </p>
                <p>
                  Não é permitido tentar contornar restrições de acesso, extrair dados de terceiros
                  de forma automatizada, publicar conteúdo ofensivo ou falso no diretório ou utilizar
                  a plataforma em desacordo com a legislação vigente.
                </p>
              </section>

              <section id="registros-auditoria" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  5. Registros assistenciais, modo offline e auditoria
                </h2>
                <p>
                  Cada registro assistencial armazena o autor autenticado, o horário informado no
                  dispositivo durante o turno e o horário efetivo de sincronização no servidor.
                  Diferenças superiores a 10 minutos entre esses horários são sinalizadas
                  automaticamente para fins de conferência e transparência.
                </p>
                <p>
                  No Painel do Funcionário, lançamentos feitos sem acesso à internet ficam guardados
                  temporariamente no navegador do aparelho até que a conexão seja restabelecida. Cabe
                  ao profissional confirmar o envio da fila pendente antes de encerrar o uso em
                  dispositivo compartilhado.
                </p>
              </section>

              <section id="diretorio-avaliacoes" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  6. Diretório público, solicitações e avaliações
                </h2>
                <p>
                  As informações exibidas em{" "}
                  <Link href="/casas" className="font-medium text-brand-strong hover:underline">
                    /casas
                  </Link>{" "}
                  (descrição, fotos, endereço, vagas e planos) são preenchidas e mantidas pela
                  própria instituição, que decide se a casa fica publicada ou em rascunho.
                </p>
                <p>
                  O envio de uma solicitação de entrada pela plataforma não configura contrato de
                  acolhimento nem garante reserva automática de vaga — a análise e a contratação
                  ocorrem diretamente entre a família e a ILPI. Para preservar a autenticidade das
                  notas públicas, apenas familiares com residente vinculado a uma casa publicada
                  podem avaliá-la, sendo vedada a autoavaliação pela equipe gestora.
                </p>
              </section>

              <section id="financeiro" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  7. Planos, assinaturas e controle financeiro
                </h2>
                <p>
                  O módulo financeiro do Ginkle tem caráter estritamente informativo e de organização
                  interna entre instituição e familiares (registro de planos, assinaturas e situação
                  de faturas). A plataforma{" "}
                  <strong className="font-semibold text-foreground">
                    não processa pagamentos, não armazena dados de cartão de crédito e não intermedia
                    cobranças bancárias
                  </strong>
                  .
                </p>
              </section>

              <section id="propriedade-disponibilidade" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  8. Propriedade intelectual e disponibilidade
                </h2>
                <p>
                  A marca, o código-fonte, a identidade visual e a interface do Ginkle pertencem aos
                  seus desenvolvedores. Os conteúdos cadastrados pelas instituições (como fotografias
                  e descrições da casa) permanecem sob titularidade de quem os publicou, concedendo
                  ao Ginkle autorização apenas para exibi-los dentro da plataforma conforme a
                  visibilidade escolhida pelo gestor.
                </p>
                <p>
                  O Ginkle busca manter o serviço disponível de forma contínua, mas podem ocorrer
                  interrupções programadas de manutenção ou indisponibilidades de infraestrutura de
                  terceiros.
                </p>
              </section>

              <section id="encerramento-foro" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  9. Alterações, encerramento e legislação aplicável
                </h2>
                <p>
                  Estes Termos podem ser atualizados para refletir melhorias do sistema ou adequações
                  legais, sempre indicando a data de revisão no topo da página. Dúvidas ou pedidos
                  relacionados à conta podem ser encaminhados para{" "}
                  <a
                    href="mailto:contato@ginkle.me"
                    className="font-medium text-brand-strong hover:underline"
                  >
                    contato@ginkle.me
                  </a>
                  .
                </p>
                <p>
                  Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial
                  pelo Marco Civil da Internet (Lei nº 12.965/2014), pela Lei Geral de Proteção de
                  Dados Pessoais (Lei nº 13.709/2018) e, no que couber, pelo Código de Defesa do
                  Consumidor (Lei nº 8.078/1990).
                </p>
              </section>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
