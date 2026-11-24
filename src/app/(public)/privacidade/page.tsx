import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Como o Ginkle coleta, armazena, protege e isola dados pessoais e dados sensíveis de saúde em conformidade com a LGPD (Lei nº 13.709/2018).",
};

const ATUALIZADO_EM = "24 de novembro de 2026";

const INDICE = [
  { id: "papeis", titulo: "1. Papéis no tratamento (LGPD)" },
  { id: "dados-coletados", titulo: "2. Quais dados tratamos" },
  { id: "finalidades-bases", titulo: "3. Finalidades e bases legais" },
  { id: "compartilhamento", titulo: "4. Isolamento e compartilhamento" },
  { id: "cookies-local", titulo: "5. Cookies e armazenamento local" },
  { id: "seguranca", titulo: "6. Medidas técnicas de segurança" },
  { id: "retencao", titulo: "7. Retenção e eliminação" },
  { id: "direitos", titulo: "8. Direitos dos titulares (Art. 18)" },
  { id: "contato", titulo: "9. Canal de privacidade e encarregado" },
];

export default function PrivacidadePage() {
  return (
    <main className="flex flex-col bg-background">
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-14 md:pb-16 md:pt-20">
          <p className="font-serif text-sm italic text-brand-strong">
            Privacidade e proteção de dados · LGPD
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Política de privacidade
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground">
            Esta política explica de forma direta quais dados o Ginkle trata, por que eles existem
            no sistema, como o acesso é isolado e como exercer seus direitos previstos na Lei Geral
            de Proteção de Dados Pessoais (Lei nº 13.709/2018).
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>Última atualização: {ATUALIZADO_EM}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <Link
              href="/termos"
              className="font-medium text-brand-strong transition-colors hover:underline"
            >
              Ler Termos de uso
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
                  Índice da política
                </summary>
                <nav aria-label="Índice da política de privacidade" className="mt-3">
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

              <nav aria-label="Índice da política de privacidade" className="hidden lg:block">
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
              <section id="papeis" className="scroll-mt-24 space-y-3">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  1. Papéis no tratamento de dados (Art. 5º da LGPD)
                </h2>
                <p>
                  No tratamento das informações cadastradas pelas instituições (dados de residentes,
                  observações médicas, rotina assistencial, escalas e vínculos familiares):
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    A <strong className="font-semibold text-foreground">ILPI cadastrada</strong>{" "}
                    atua como <strong className="font-semibold text-foreground">Controladora</strong>
                    , definindo quais dados de residentes, equipe e familiares são inseridos e quem
                    tem autorização de acesso.
                  </li>
                  <li>
                    O <strong className="font-semibold text-foreground">Ginkle</strong> atua como{" "}
                    <strong className="font-semibold text-foreground">Operador</strong>, fornecendo
                    a infraestrutura técnica para armazenar, isolar e exibir esses registros conforme
                    as permissões definidas pela instituição.
                  </li>
                </ul>
                <p>
                  Para os dados da conta do próprio usuário (criação de acesso, autenticação e
                  recuperação de senha), o Ginkle realiza o tratamento necessário à operação da
                  plataforma.
                </p>
              </section>

              <section id="dados-coletados" className="scroll-mt-24 space-y-4 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  2. Quais dados tratamos
                </h2>
                <p>
                  O Ginkle coleta apenas os dados necessários para o funcionamento de cada fluxo
                  previsto no sistema:
                </p>

                <div className="overflow-x-auto rounded-sm border border-border bg-card">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50 text-foreground">
                        <th className="px-4 py-3 font-semibold">Categoria</th>
                        <th className="px-4 py-3 font-semibold">Dados tratados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Conta e perfil do usuário
                        </td>
                        <td className="px-4 py-3">
                          Nome completo, e-mail, CPF, telefone (opcional), data de nascimento
                          (opcional), foto de perfil (opcional) e credenciais criptografadas de
                          autenticação.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Dados da instituição (ILPI)
                        </td>
                        <td className="px-4 py-3">
                          Razão/nome, CNPJ, endereço, cidade/UF, telefone, e-mail, site, vagas,
                          fotos do espaço, planos e vínculos de equipe/escala.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Dados sensíveis de saúde do residente (Art. 5º, II)
                        </td>
                        <td className="px-4 py-3">
                          Nome, data de nascimento, sexo, status de acolhimento, observações médicas
                          e registros assistenciais de cuidados, medicamentos, sinais vitais e
                          ocorrências, com autor e duplo horário.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Comunicação e solicitações
                        </td>
                        <td className="px-4 py-3">
                          Mensagens trocadas no chat entre familiares e equipe da casa, pedidos de
                          adesão, avaliações públicas (nota e comentário) e registros informativos de
                          assinaturas e faturas.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="finalidades-bases" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  3. Finalidades e bases legais
                </h2>
                <p>
                  Os dados são utilizados exclusivamente para viabilizar o funcionamento da
                  plataforma, com fundamento nos Arts. 7º e 11 da LGPD:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong className="font-semibold text-foreground">
                      Execução de contrato e procedimentos preliminares (Art. 7º, V):
                    </strong>{" "}
                    autenticação, gestão de instituições, solicitações de entrada, comunicação no
                    chat e acompanhamento informativo de planos.
                  </li>
                  <li>
                    <strong className="font-semibold text-foreground">
                      Tutela da saúde e rotina assistencial (Art. 11, II, “f”):
                    </strong>{" "}
                    registro diário de cuidados, medicamentos, sinais vitais, ocorrências e
                    observações médicas realizados pela equipe da ILPI.
                  </li>
                  <li>
                    <strong className="font-semibold text-foreground">
                      Cumprimento de obrigação legal ou regulatória (Art. 7º, II e Art. 11, II, “a”):
                    </strong>{" "}
                    manutenção de trilhas de auditoria, integridade de registros e guarda exigida
                    pelo Marco Civil da Internet e por normas sanitárias.
                  </li>
                  <li>
                    <strong className="font-semibold text-foreground">
                      Prevenção à fraude e segurança (Art. 11, II, “g”):
                    </strong>{" "}
                    validação de identidade, controle de permissões e detecção de discrepâncias de
                    horário nos registros.
                  </li>
                </ul>
                <p>
                  O Ginkle <strong className="font-semibold text-foreground">não comercializa</strong>{" "}
                  dados pessoais e não utiliza informações de saúde para publicidade ou criação de
                  perfis comerciais.
                </p>
              </section>

              <section id="compartilhamento" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  4. Isolamento de dados e compartilhamento
                </h2>
                <p>
                  Os dados assistenciais e de residentes nunca são públicos. O acesso é estritamente
                  restrito por políticas de segurança em nível de linha no banco de dados
                  (Row-Level Security):
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    profissionais vinculados a uma ILPI acessam apenas residentes, escalas e
                    conversas da própria instituição;
                  </li>
                  <li>
                    familiares acessam apenas a ficha e a linha do tempo dos residentes aos quais
                    foram explicitamente vinculados;
                  </li>
                  <li>
                    visitantes sem login veem somente as informações públicas de casas marcadas como
                    publicadas pelo gestor (como fotos do espaço, vagas, planos e avaliações).
                  </li>
                </ul>
                <p>
                  Para operar a infraestrutura técnica, o sistema utiliza provedores de hospedagem e
                  banco de dados (como Vercel e Supabase), estritamente como operadores de
                  infraestrutura sob conexão criptografada (HTTPS/TLS).
                </p>
              </section>

              <section id="cookies-local" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  5. Cookies e armazenamento local no navegador
                </h2>
                <p>
                  O Ginkle <strong className="font-semibold text-foreground">não utiliza</strong>{" "}
                  cookies de publicidade, pixels de redes sociais nem ferramentas de rastreamento de
                  terceiros. Por utilizarmos apenas mecanismos estritamente necessários ao
                  funcionamento da aplicação, não exibimos banners invasivos de consentimento de
                  marketing.
                </p>
                <div className="overflow-x-auto rounded-sm border border-border bg-card">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50 text-foreground">
                        <th className="px-4 py-3 font-semibold">Mecanismo</th>
                        <th className="px-4 py-3 font-semibold">Finalidade estritamente necessária</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Cookies de sessão (Supabase Auth)
                        </td>
                        <td className="px-4 py-3">
                          Manter a sessão autenticada, renovar credenciais de acesso e proteger rotas
                          privadas por perfil.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Armazenamento local (<code className="text-xs">localStorage</code>)
                        </td>
                        <td className="px-4 py-3">
                          Lembrar a preferência de tema claro ou escuro (<code className="text-xs">ginkle-theme</code>).
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Banco local (<code className="text-xs">IndexedDB</code>)
                        </td>
                        <td className="px-4 py-3">
                          Guardar temporariamente registros assistenciais criados sem conexão no
                          Painel do Funcionário, excluindo cada item do aparelho após a
                          sincronização com o servidor.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="seguranca" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  6. Medidas técnicas de segurança (Art. 46 da LGPD)
                </h2>
                <p>
                  Adotamos boas práticas de segurança proporcionais à sensibilidade dos dados de
                  saúde:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    isolamento multi-instituição e por vínculo familiar aplicado diretamente no banco
                    de dados (RLS), sem uso de chaves administrativas privilegiadas na aplicação;
                  </li>
                  <li>
                    tráfego criptografado via HTTPS/TLS e cabeçalhos HTTP de proteção contra
                    clickjacking e vazamento de origem;
                  </li>
                  <li>
                    trilha de auditoria de ações relevantes e duplo registro de horário (dispositivo
                    e servidor) nos lançamentos assistenciais;
                  </li>
                  <li>
                    senhas protegidas por hash seguro gerenciado pelo serviço de autenticação.
                  </li>
                </ul>
              </section>

              <section id="retencao" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  7. Retenção e eliminação de dados
                </h2>
                <p>
                  Os dados permanecem armazenados enquanto houver conta ativa, vínculo institucional
                  ou necessidade de guarda para cumprimento de obrigação legal, regulatória ou
                  auditoria assistencial.
                </p>
                <p>
                  Por segurança e rastreabilidade do histórico assistencial, registros de residentes
                  e logs de auditoria não são apagados arbitrariamente durante a operação comum —
                  quando um residente deixa a casa, seu status é atualizado (por exemplo, para{" "}
                  <em>Alta</em> ou <em>Inativo</em>) preservando a integridade do histórico. Pedidos
                  de eliminação ou anonimização cabíveis são avaliados caso a caso junto à
                  instituição controladora.
                </p>
              </section>

              <section id="direitos" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  8. Direitos dos titulares (Art. 18 da LGPD)
                </h2>
                <p>
                  Nos termos do Art. 18 da LGPD, o titular dos dados pessoais (ou seu representante
                  legal) pode solicitar a qualquer momento:
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>confirmação da existência de tratamento e acesso aos seus dados;</li>
                  <li>correção de dados incompletos, inexatos ou desatualizados (parte deles editável diretamente na aba Perfil);</li>
                  <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
                  <li>informações sobre entidades públicas ou privadas com as quais houve compartilhamento;</li>
                  <li>revogação de consentimento, quando aplicável, e oposição ao tratamento em desacordo com a lei.</li>
                </ul>
                <p>
                  Para solicitações envolvendo dados assistenciais de um residente, o pedido deve ser
                  direcionado preferencialmente à ILPI responsável (Controladora), que conta com o
                  suporte técnico do Ginkle para o atendimento.
                </p>
              </section>

              <section id="contato" className="scroll-mt-24 space-y-3 border-t border-border pt-8">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                  9. Canal de privacidade e encarregado
                </h2>
                <p>
                  Dúvidas sobre esta Política de privacidade ou solicitações relacionadas à proteção
                  de dados na plataforma podem ser enviadas para o canal de contato do projeto:
                </p>
                <div className="rounded-sm border border-border bg-card p-5 text-sm">
                  <p className="font-semibold text-foreground">Ginkle · Equipe Viventi</p>
                  <p className="mt-1">
                    E-mail:{" "}
                    <a
                      href="mailto:contato@ginkle.me"
                      className="font-medium text-brand-strong hover:underline"
                    >
                      contato@ginkle.me
                    </a>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Praia Grande · SP · ETEC Praia Grande
                  </p>
                </div>
              </section>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
