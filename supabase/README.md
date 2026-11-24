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
10. `migrations/0010_corrige_rls.sql` — corrige o isolamento entre casas e a linha do tempo do familiar
11. `migrations/0011_limpa_rls_grants.sql` — vazamento de casa em rascunho, insert direto de casa e EXECUTE das funções
12. `migrations/0012_painel_gestor.sql` — leitura de solicitantes/assinantes/colegas inativos, RPCs por e-mail, financeiro do gestor e auditoria por casa
13. `migrations/0013_fotos_storage.sql` — coluna `usuario.avatar_url`, buckets públicos (`fotos-casas`, `avatares`) e policies de Storage por pasta
14. `migrations/0014_integridade_rls.sql` — corrige produto cartesiano em `ilpi_publica`, avaliações de casa privada para a equipe, edição de assinatura após desvincular familiar, `adesao_solicita` só em casa publicada, proteção LGPD de `cpf`/`data_nascimento` em `usuario` (`meu_perfil()`) e trava antifraude em `registro_assistencial.sincronizado_em_servidor`
15. `migrations/0015_escala_chat.sql` — tabela `escala_turno` com RLS por casa (equipe lê, gestor gerencia) e policies de chat equipe ↔ familiar (`usuario_equipe_le_chat` + `conversa_cria` para equipe)
16. `migrations/0016_realtime_chat.sql` — inclui `public.mensagem` e `public.conversa` na publicação `supabase_realtime` para entrega em tempo real respeitando a RLS
17. `seed.sql` — as 8 casas do protótipo
18. `seed_fotos_planos.sql` — fotos e planos dessas casas

Todos são idempotentes: pode rodar de novo sem duplicar.

### Demo para a apresentação (opcional)

Depois dos seeds, `node supabase/demo.mjs` cria um cenário de demonstração por
RLS: 6 contas (1 gestora, 3 funcionários, 2 familiares), 3 casas (duas
publicadas e uma em rascunho), residentes, 12 registros por casa (11 pontuais e
1 com 25 min de atraso), avaliações e adesões. A senha das contas vem de
`DEMO_PW` (nunca no repositório); o script é idempotente, `demo-reset-dados.sql`
limpa apenas os dados operacionais mantendo as contas demo e `demo-limpar.sql`
desfaz tudo na ordem das chaves estrangeiras. Para espalhar os registros das
casas de demonstração ao longo dos últimos 7 dias (sem abrir brecha na API),
rode `supabase/demo-datas-historicas.sql` no SQL Editor depois do `demo.mjs`.

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
   alcançável pela API sem `grant` explícito. `log_acao` não tem `insert`,
   `update` nem `delete` para `authenticated`: é preenchida por trigger no banco
   (append-only) e legível apenas pelo gestor da casa (`0012`).
2. **RLS** (linha): toda tabela tem RLS ligada. O familiar vê o residente
   vinculado a ele (`familiar_residente`) e a equipe da casa vê os da casa.

Exceção consciente: a equipe da casa **lê o contato do familiar** vinculado a um
residente dela (`usuario_equipe_le_familiares`). É o que permite ligar para a
família na central de aprovações e no chat. Ninguém mais vê esse perfil.

As policies de leitura pública (`ilpi`, `foto_ilpi`, `plano`, `avaliacao`) são
**duas**: uma `to anon` (só `publicado`) e uma `to authenticated`
(`publicado or eh_equipe`, e nas de casa/foto também `eh_familiar_da_casa`). A
separação existe para o `anon` não precisar de `EXECUTE` em `eh_equipe()` — se
fossem uma policy só, revogar o EXECUTE do anon derrubaria o diretório com
`permission denied for function eh_equipe`.

`eh_familiar_da_casa(id_ilpi)` existe porque `publicado` sozinho **não cobre o
familiar**: quem tem um residente na casa precisa ler o endereço, o telefone e a
foto dela mesmo que ela esteja em rascunho ou fora do diretório. Sem esse
helper, a correção do vazamento tiraria justamente isso — o familiar só via a
foto pelo bug. Aplica-se a `ilpi` e `foto_ilpi` (o portal não usa `plano` nem
`avaliacao` de casa não publicada).

As funções `eh_gestor`, `eh_equipe`, `eh_familiar_de`, `eh_familiar_da_casa`,
`pode_ver_residente`, `eh_meu_vinculo`, `cargo_na_ilpi` e `meu_cargo` são
`security definer` de propósito: sem isso, uma policy em `vinculo_ilpi` que
consulta `vinculo_ilpi` entra em recursão infinita (erro 42P17). O `EXECUTE`
delas é de `authenticated` (quem avalia as policies) e mais ninguém; `anon` foi
revogado. Cuidado ao revogar de `authenticated`: a expressão da policy roda como
quem consulta e a permissão é verificada.

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
- `public.vincular_equipe_por_email(...)` e `public.vincular_familiar_por_email(...)` —
  adicionam profissional (apenas gestor) ou familiar (equipe) por e-mail sem
  abrir a tabela `usuario` para busca irrestrita (`0012`).
- `public.meu_perfil()` — devolve o perfil completo (inclusive `cpf` e
  `data_nascimento`) exclusivamente do `auth.uid()`, permitindo manter essas
  colunas fora do `SELECT` geral de `public.usuario` (`0014`).

## Como isto foi verificado

Os SQLs foram rodados de ponta a ponta num Postgres 16 em WebAssembly (PGlite),
com um schema `auth` de mentira (`auth.users` + `auth.uid()` a partir de
`request.jwt.claim.sub`) e as roles `anon`/`authenticated`. Resultado: as
migrations (0001–0010) + os 2 seeds rodam limpos, são idempotentes (2a rodada
sem erro) e as asserções de RLS passam, incluindo:

- anônimo lê `ilpi_publica` e toma `42501` em `usuario` e `log_acao`;
- familiar vê o residente vinculado e um estranho não vê nenhum;
- `id_usuario` de outro não pode ser falsificado no insert (policy);
- a mesma pessoa não avalia a casa duas vezes (`23505`);
- `criar_ilpi()` deixa o criador como `GESTOR` e grava `ILPI_CRIADA` no log.

A `0010` foi verificada à parte, com **dois inquilinos** (o que a primeira
rodada não cobria): sem ela, a equipe da casa A lê vínculo, mensagem e fatura da
casa B e grava registro no residente da casa B; com ela, 8/8 asserções passam e
o familiar lê a própria linha do tempo, com o nome do autor. A `0010` roda duas
vezes sem erro.

A `0011` foi verificada com 23 asserções (`%TEMP%\opencode\sqlcheck\rls0011.mjs`,
que também roda sem a `0011` para medir o antes): sem ela são **8 falhas** — o
`anon` lê fotos, planos e avaliações da casa em rascunho, chama `eh_equipe()`,
um `authenticated` sem vínculo insere casa direto, avalia casa publicada e avalia
casa em rascunho. Com ela, 23/23: só quem tem parente na casa avalia (`familiar`
passa, estranho e gestor da própria casa não), e o `anon` continua lendo o
diretório (`ilpi_publica` traz a casa publicada) e a RPC `criar_ilpi()` segue
criando a casa e o vínculo de gestor.

Uma segunda bateria, `portal_probe.mjs` (**25/25**), roda as migrations com o
formato exato das consultas do Portal do Familiar contra **duas famílias em casas
diferentes**, uma delas em rascunho: o familiar A não lê residente, linha do tempo
nem vínculo do familiar B (nem da casa em rascunho alheia); o familiar da casa em
rascunho lê o próprio residente, a própria linha do tempo (com nome e cargo do
autor) e a ficha e a foto da própria casa; o gestor de uma casa não alcança o
residente da outra; o `anon` vê só as casas publicadas. Sem a `0011`, as mesmas
consultas expõem 3 fotos para o `anon` (era o vazamento).

Foi essa bateria que revelou o caso do item 0 (`eh_familiar_da_casa`): com a
correção "pura", o familiar de um residente de casa em rascunho perdia a foto
(antes via, pelo bug) e a ficha (que já não via antes).

Duas checagens extras, porque mexem em caminho crítico: o trigger de cadastro
continua disparando sem nenhum `EXECUTE` (`trigger_probe.mjs` — o INSERT em
`auth.users` cria a linha em `usuario`), e o `demo.mjs` passou a avaliar só casa
publicada (antes ele avaliava a de rascunho e só funcionava por causa do bug).

## Lints do Supabase aceitos de propósito

O painel de lints do Supabase acusa itens que são escolha consciente. Os que
ficam:

- `security_definer_view` (ERROR) em `avaliacao_publica` e `registro_timeline` —
  é o padrão certo quando a view precisa juntar outra tabela (ex.: `usuario`)
  para devolver uma coluna derivada e filtrar por conta própria. As duas filtram
  (`publicado` / `pode_ver_residente`) e devolvem só colunas seguras; trocar por
  `security_invoker` quebraria a feature, não melhoraria a segurança.
- `authenticated_security_definer_function_executable` nos helpers (`eh_equipe`,
  `eh_gestor`, `eh_gestor_da_pasta`, `eh_familiar_de`, `eh_familiar_da_casa`, `eh_assinante_do_plano`,
  `pode_ver_residente`, `eh_meu_vinculo`, `meu_cargo`, `cargo_na_ilpi`) e nas
  RPCs (`criar_ilpi`, `vincular_equipe_por_email`, `vincular_familiar_por_email`)
  — a expressão de uma policy roda como **quem consulta**, então `authenticated`
  precisa mesmo de `EXECUTE` nesses helpers; revogar quebraria toda a RLS. São
  predicados keyed em `auth.uid()`, que devolvem `false`/`null` para quem não
  tem vínculo (verificado). Fechar isso de vez significa mover os helpers para
  um schema não exposto (`private.`), o que obriga a reescrever as policies —
  fica como melhoria opcional, não como bloqueio.
- `*_security_definer_function_executable` em `rls_auto_enable()` — função criada
  pela própria plataforma do Supabase (não está nas migrations), usada em event
  trigger. Fora do nosso controle.
- `auth_leaked_password_protection` — ligar em Authentication → Providers →
  "Prevent use of leaked passwords". É um clique no painel, não SQL.

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