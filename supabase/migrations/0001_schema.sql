-- 0001 · schema público (porta do modelo MySQL). Rodar no SQL Editor, em ordem.
-- Porta: minúsculo (Postgres dobra não-aspeado), DATETIME->timestamptz, TINYINT(1)->boolean,
-- VARCHAR(36)->uuid, CHECK no lugar de ENUM.
-- Usuario não guarda senha: ela mora em auth.users, e usuario.id_usuario é o mesmo id.

-- gen_random_uuid() é nativo desde o Postgres 13: não precisa de pgcrypto.

-- -----------------------------------------------------------------------------
-- USUARIO — perfil público do usuário autenticado
-- -----------------------------------------------------------------------------
create table if not exists public.usuario (
  id_usuario      uuid primary key references auth.users (id) on delete cascade,
  nome            text not null check (length(trim(nome)) >= 3),
  email           text not null,
  cpf             text,
  telefone        text,
  data_nascimento date,
  data_cadastro   timestamptz not null default now()
);

create unique index if not exists un_usuario_email on public.usuario (lower(email));
create unique index if not exists un_usuario_cpf on public.usuario (cpf) where cpf is not null;
create index if not exists ix_usuario_nome on public.usuario (nome);

comment on column public.usuario.cpf is
  'Somente dígitos. Opcional no banco; o formulário de cadastro exige.';
comment on column public.usuario.email is
  'Espelho de auth.users.email, mantido pelo trigger on_auth_user_created.';

-- -----------------------------------------------------------------------------
-- ILPI
-- -----------------------------------------------------------------------------
create table if not exists public.ilpi (
  id_ilpi        uuid primary key default gen_random_uuid(),
  slug           text not null,
  cnpj           text not null,
  nome           text not null,
  telefone       text not null,
  email          text not null,
  site           text,
  descricao      text,
  endereco       text not null,
  cidade         text not null,
  bairro         text not null,
  uf             char(2) not null default 'SP',
  vagas          integer not null default 0 check (vagas >= 0),
  destaque       text,
  tags           text[] not null default '{}',
  publicado      boolean not null default true,
  data_cadastro  timestamptz not null default now()
);

create unique index if not exists un_ilpi_slug on public.ilpi (slug);
create unique index if not exists un_ilpi_cnpj on public.ilpi (cnpj);
create index if not exists ix_ilpi_cidade on public.ilpi (cidade);
create index if not exists ix_ilpi_publicado on public.ilpi (publicado) where publicado;

comment on column public.ilpi.slug is
  'Usado na rota /casas/[slug]. Estável: não trocar depois de publicado.';
comment on column public.ilpi.vagas is
  'Vagas disponíveis hoje (não é capacidade total).';
comment on column public.ilpi.cidade is
  'Normalizado do endereço: o diretório público filtra por cidade/bairro.';

-- -----------------------------------------------------------------------------
-- FOTO_ILPI
-- -----------------------------------------------------------------------------
create table if not exists public.foto_ilpi (
  id_foto     uuid primary key default gen_random_uuid(),
  id_ilpi     uuid not null references public.ilpi (id_ilpi) on delete cascade,
  url         text not null,
  legenda     text,
  ordem       integer not null default 0,
  data_upload timestamptz not null default now()
);

create index if not exists ix_foto_ilpi on public.foto_ilpi (id_ilpi, ordem);

-- -----------------------------------------------------------------------------
-- PLANO
-- -----------------------------------------------------------------------------
create table if not exists public.plano (
  id_plano  uuid primary key default gen_random_uuid(),
  id_ilpi   uuid not null references public.ilpi (id_ilpi) on delete cascade,
  nome      text not null,
  valor     numeric(10, 2) not null check (valor >= 0),
  descricao text,
  ativo     boolean not null default true
);

create index if not exists ix_plano_ilpi on public.plano (id_ilpi) where ativo;

-- -----------------------------------------------------------------------------
-- AVALIACAO — uma por usuário por casa
-- -----------------------------------------------------------------------------
create table if not exists public.avaliacao (
  id_avaliacao   uuid primary key default gen_random_uuid(),
  id_usuario     uuid not null references public.usuario (id_usuario) on delete cascade,
  id_ilpi        uuid not null references public.ilpi (id_ilpi) on delete cascade,
  nota           smallint not null check (nota between 1 and 5),
  comentario     text check (comentario is null or length(comentario) <= 2000),
  data_avaliacao timestamptz not null default now(),
  unique (id_usuario, id_ilpi)
);

create index if not exists ix_avaliacao_ilpi on public.avaliacao (id_ilpi, data_avaliacao desc);