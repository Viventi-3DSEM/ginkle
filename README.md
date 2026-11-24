# Ginkle

Plataforma de gestão assistencial, descoberta e transparência para Instituições de Longa Permanência para Idosos (ILPIs). Projeto de TCC em Desenvolvimento de Sistemas — ETEC Praia Grande (Grupo Viventi).

Stack: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Supabase (Auth, Postgres com RLS, Storage e Realtime).

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # ESLint
npx tsc --noEmit # Type-check
npm run build    # Build de produção
```

O site público funciona **sem** banco configurado: `/casas` usa o catálogo demonstrativo (`src/lib/ilpi/demo.ts`) e as telas de autenticação avisam que o Supabase não está ligado.

## Ligar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Deixe marcados **Enable Data API** e **Enable automatic RLS**, e **desmarque** "Automatically expose new tables" — as permissões são concedidas tabela por tabela via migration.
3. No painel do Supabase (Connect / Settings → API Keys), copie a URL e a chave **publishable** (`sb_publishable_...`) para `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
   ```

   A chave `anon` legada (`eyJ...`) também é aceita. O projeto não usa `service_role` / `SUPABASE_SECRET_KEY`: todo acesso passa pelas políticas de RLS do usuário autenticado.
4. Execute as migrations (`0001_schema.sql` até `0016_realtime_chat.sql`) no SQL Editor seguindo a ordem descrita em [`supabase/README.md`](supabase/README.md).
5. Reinicie o `npm run dev`.

## Dados de demonstração

Para popular um cenário completo de apresentação (contas de gestor, funcionários e familiares, casas, residentes, registros assistenciais, escalas, solicitações, assinaturas, faturas, avaliações e conversas):

```powershell
$env:DEMO_PW = "sua-senha-min-6-chars"
node supabase/demo.mjs
```

- Limpar dados de teste mantendo as contas de demonstração: rode `supabase/demo-reset-dados.sql` no SQL Editor e execute `node supabase/demo.mjs` novamente.
- Remover tudo (inclusive contas demo): `supabase/demo-limpar.sql`.
- Botões de acesso rápido no `/login` ficam **desligados por padrão** e só aparecem quando `DEMO_HABILITADO=1` e `DEMO_SENHA` (variáveis de servidor, nunca `NEXT_PUBLIC_`) estão definidos no ambiente.

## Funcionalidades por perfil

O papel não é uma coluna fixa: deriva do vínculo ativo em `vinculo_ilpi` (gerenciado por `src/proxy.ts` + `src/lib/supabase/middleware.ts`).

| Perfil | Rota principal | O que faz |
|---|---|---|
| **Público** | `/`, `/sobre`, `/casas`, `/casas/[slug]` | Vitrine institucional e diretório público de ILPIs com busca, filtros, planos e avaliações |
| **Familiar** (sem vínculo em `vinculo_ilpi`) | `/cliente/*` | Residentes vinculados, linha do tempo de cuidados somente leitura (com duplo timestamp), solicitações de entrada, financeiro informativo, avaliações, chat em tempo real e perfil |
| **Funcionário** (`FUNCIONARIO`) | `/funcionario/*` | Turno do dia, registro assistencial guiado com fila offline em IndexedDB e sincronização automática, lista/ficha de residentes, central de aprovações, chat em tempo real, minha escala, histórico e perfil |
| **Gestor** (`GESTOR`) | `/gerente/*` | Dashboard multi-casa, cadastro/edição/fotos/visibilidade de casas, gestão de equipe e escala de turnos, residentes e vínculos familiares, planos, financeiro/assinantes, auditoria de ações e perfil |

Quem cria uma conta sem vínculo pode cadastrar a própria instituição em `/cadastrar-instituicao`: a RPC `criar_ilpi()` cria a casa e promove a conta para `GESTOR` na mesma transação.

## Estrutura do projeto

```text
src/app/(public)/        landing (/), /sobre, /casas e /casas/[slug]
src/app/(auth)/          /login, /cadastro, /recuperar-senha e /redefinir-senha
src/app/(protected)/     /cliente/*, /funcionario/*, /gerente/* e /cadastrar-instituicao
src/app/auth/            callbacks de confirmação e recuperação do Supabase Auth
src/components/          componentes de interface separados por área (Header, Footer, painel, portal, funcionario)
src/lib/supabase/        clientes Supabase (browser, server, middleware/proxy)
src/lib/ilpi/            leitura e catálogo demonstrativo do diretório público
src/lib/painel/          leitura, server actions e formatadores do painel do gestor
src/lib/portal/          leitura e server actions do portal do familiar
src/lib/funcionario/     leitura, server actions e fila offline (IndexedDB) do funcionário
src/proxy.ts             renovação de sessão e guarda de rotas por perfil
supabase/                migrations 0001–0016, seeds, scripts de demo e mapa do banco
```
