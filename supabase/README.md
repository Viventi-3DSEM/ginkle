# Banco de dados (Supabase)

Porta do modelo MySQL do TCC para PostgreSQL. As tabelas, chaves e
relacionamentos são os mesmos do diagrama; o que mudou está listado abaixo.

## Ordem de execução

No SQL Editor do Supabase, rodar **um arquivo por vez, nesta ordem**:

1. `migrations/0001_schema.sql` — usuário, ILPI, fotos, planos, avaliações
2. `migrations/0002_vinculos.sql` — vínculos, residentes, famílias, adesões
3. `migrations/0003_registros.sql` — registros, auditoria, chat, financeiro
4. `migrations/0004_funcoes.sql` — trigger de cadastro, helpers, view pública
5. `migrations/0005_rls_grants.sql` — RLS ligada e privilégios
6. `migrations/0006_policies.sql` — policies de conta, casa, plano, avaliação
7. `migrations/0007_policies_dados.sql` — policies de residente, registro, chat
8. `migrations/0008_views_rpc.sql` — avaliação pública, timeline, RPC `criar_ilpi`
9. `migrations/0009_usuario_equipe.sql` — a equipe de uma casa lê o nome dos colegas
10. `seed.sql` — as 8 casas do protótipo
11. `seed_fotos_planos.sql` — fotos e planos dessas casas

Todos são idempotentes: pode rodar de novo sem duplicar.

### Demo para a apresentação (opcional)

Depois dos seeds, `node supabase/demo.mjs` cria um cenário de demonstração por
RLS: 5 contas, 3 casas (duas publicadas e uma em rascunho), residentes,
registros espalhados por 7 dias, avaliações e adesões. A senha das contas vem de
`DEMO_PW` (nunca no repositório); o script é idempotente e `demo-limpar.sql`
desfaz tudo na ordem das chaves estrangeiras.

## O que mudou na porta MySQL → Postgres

| MySQL | Postgres | Por quê |
|---|---|---|
| `USUARIO` / `id_usuario` | `usuario` / `id_usuario` | o Postgres dobra identificador não-aspeado para minúsculo |
| `VARCHAR(36)` + UUID na aplicação | `uuid` + `gen_random_uuid()` | uuid nativo, indexa melhor e não deixa string solta entrar |
| `TINYINT(1)` | `boolean` | tipo nativo |
| `DATETIME` | `timestamptz` | guarda fuso; o duplo timestamp da auditoria precisa disso |
| `senha` (implícita) | não existe | quem guarda senha é o `auth.users` do Supabase Auth |
| `ENUM`/texto livre | `check (... in (...))` | valida no banco e é fácil de evoluir |
| — | `ilpi.slug`, `cidade`, `bairro`, `uf`, `publicado`, `tags` | a vitrine precisa de URL limpa e filtro por cidade |
| — | `unique (id_usuario, id_ilpi)` em `avaliacao` | sem isso o mesmo familiar avalia a casa dez vezes |

### Sobre o `id_usuario`

`usuario.id_usuario` é o **mesmo id** de `auth.users.id` (foreign key com
`on delete cascade`). O Supabase cria a linha em `usuario` automaticamente
quando alguém se cadastra: o trigger `on_auth_user_created` copia nome, CPF e
telefone de `raw_user_meta_data`, que é o que o formulário de `/cadastro` envia.
Por isso a tabela não tem senha — ela nunca passa pelo schema público.

## Duas camadas de permissão

1. **Grant** (tabela): com "Automatically expose new tables" desmarcado, nada é
   alcançável pela API sem `grant` explícito. `log_acao` não tem grant nenhum:
   só o servidor (chave secreta) escreve e lê.
2. **RLS** (linha): toda tabela tem RLS ligada. O familiar vê o residente
   vinculado a ele (`familiar_residente`) e a equipe da casa vê os da casa.

Exceção consciente: a equipe da casa **lê o contato do familiar** vinculado a um
residente dela (`usuario_equipe_le_familiares`). É o que permite ligar para a
família na central de aprovações e no chat. Ninguém mais vê esse perfil.

As funções `eh_gestor`, `eh_equipe`, `eh_familiar_de`, `pode_ver_residente` são
`security definer` de propósito: sem isso, uma policy em `vinculo_ilpi` que
consulta `vinculo_ilpi` entra em recursão infinita (erro 42P17).

## Funções que a aplicação usa

- `public.ilpi_publica` — view do diretório (nota média, nº de avaliações,
  menor mensalidade, foto de capa). É o que `/casas` lê.
- `public.avaliacao_publica` — avaliações com o nome abreviado de quem avaliou
  ("Maria S."), sem expor e-mail/CPF.
- `public.registro_timeline` — registros com autor, cargo e a flag
  `sincronizacao_atrasada` (>10 min entre dispositivo e servidor).
- `public.criar_ilpi(...)` — cria a casa **e** o vínculo de gestor do usuário
  logado na mesma transação (a policy de `vinculo_ilpi` sozinha nunca deixaria
  o primeiro gestor entrar).

## Como isto foi verificado

Os SQLs foram rodados de ponta a ponta num Postgres 16 em WebAssembly (PGlite),
com um schema `auth` de mentira (`auth.users` + `auth.uid()` a partir de
`request.jwt.claim.sub`) e as roles `anon`/`authenticated`. Resultado: as
migrations (0001–0009) + os 2 seeds rodam limpos, são idempotentes (2a rodada
sem erro) e as asserções de RLS passam, incluindo:

- anônimo lê `ilpi_publica` e toma `42501` em `usuario` e `log_acao`;
- familiar vê o residente vinculado e um estranho não vê nenhum;
- `id_usuario` de outro não pode ser falsificado no insert (policy);
- a mesma pessoa não avalia a casa duas vezes (`23505`);
- `criar_ilpi()` deixa o criador como `GESTOR` e grava `ILPI_CRIADA` no log.

## Configuração no painel

- **Authentication → URL Configuration → Redirect URLs**: adicionar
  `http://localhost:3000/auth/callback` e o domínio de produção
  `https://SEU-DOMINIO/auth/callback`.
- **Authentication → Email Templates**: se o template usar `{{ .TokenHash }}`,
  o link deve apontar para `/auth/confirm?token_hash={{ .TokenHash }}&type=...`.
  O link padrão (`{{ .ConfirmationURL }}`) já volta em `/auth/callback`.
- **SMTP próprio** (Resend, Brevo, Gmail) em Authentication → SMTP. O SMTP
  embutido do Supabase tem limite baixo (poucos e-mails por hora) e só entrega
  para membros do projeto — sem isso, o fluxo de recuperar senha não demonstra.