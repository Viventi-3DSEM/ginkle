# Ginkle

Plataforma de gestão assistencial, descoberta e transparência para ILPIs.
Next.js 16 (App Router) + TypeScript + Tailwind 4.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run lint
```

O site funciona **sem** banco configurado: o diretório de casas cai no catálogo
demonstrativo (`src/lib/ilpi/demo.ts`) e as telas de login/cadastro respondem com
um aviso. Para ligar o banco de verdade:

## Ligar o Supabase

1. Crie o projeto em [supabase.com](https://supabase.com).
2. Na criação, deixe marcados **Enable Data API** e **Enable automatic RLS** e
   **desmarque** "Automatically expose new tables" — o projeto concede privilégio
   tabela por tabela, de propósito.
3. Dashboard → **Connect** (ou Settings → API Keys) → copie a URL e a chave
   **publishable** (`sb_publishable_...`) para o `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
   ```

   A chave `anon` antiga (começa com `eyJ`) também funciona: o código aceita os
   dois nomes de variável. **Nunca** coloque a chave secreta
   (`sb_secret_...` / `service_role`) em variável `NEXT_PUBLIC_`.
4. Rode os SQLs de `supabase/` na ordem descrita em
   [`supabase/README.md`](supabase/README.md) (migrations → seed).
5. Reinicie o `npm run dev`. Em `/casas` as casas passam a vir do banco.

## Estrutura

```
src/app/(public)/        landing, /sobre, /casas e /casas/[slug]
src/app/(auth)/          login, cadastro, recuperar-senha, redefinir-senha
src/app/(protected)/     home-cliente, home-funcionario, cadastrar-instituicao e gerente/*
src/app/auth/            rotas de callback do Supabase Auth
src/lib/supabase/        clientes (browser, servidor, proxy)
src/lib/ilpi/            dados e tipos do diretório público
src/lib/painel/          leitura e server actions do painel do gestor
src/components/painel/   shell do painel, card e formulário da casa
src/proxy.ts             renovação de sessão + guarda de rota por papel
supabase/                migrations, seeds, demo e o mapa do banco
```

### Papéis

O papel não é uma coluna: sai do vínculo com a casa (`vinculo_ilpi`).

- sem vínculo → familiar · `/home-cliente`
- `FUNCIONARIO` → `/home-funcionario`
- `GESTOR` → `/gerente`

Quem ainda não tem vínculo nenhum passa por `/cadastrar-instituicao`: ao criar a
primeira casa pela RPC `criar_ilpi()`, a pessoa vira `GESTOR` dela.

O `src/proxy.ts` renova a sessão a cada request e desvia quem tenta abrir uma
área que não é a sua.
