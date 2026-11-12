-- 0002 · vínculos, residentes e adesões

-- VINCULO_ILPI — funcionário ou gestor de uma casa
create table if not exists public.vinculo_ilpi (
  id_vinculo    uuid primary key default gen_random_uuid(),
  id_usuario    uuid not null references public.usuario (id_usuario) on delete cascade,
  id_ilpi       uuid not null references public.ilpi (id_ilpi) on delete cascade,
  cargo         text not null check (cargo in ('GESTOR', 'FUNCIONARIO')),
  ativo         boolean not null default true,
  data_vinculo  timestamptz not null default now(),
  unique (id_usuario, id_ilpi)
);

create index if not exists ix_vinculo_usuario on public.vinculo_ilpi (id_usuario) where ativo;
create index if not exists ix_vinculo_ilpi on public.vinculo_ilpi (id_ilpi) where ativo;

-- RESIDENTE
create table if not exists public.residente (
  id_residente         uuid primary key default gen_random_uuid(),
  id_ilpi              uuid not null references public.ilpi (id_ilpi) on delete restrict,
  nome                 text not null,
  cpf                  text not null,
  data_nascimento      date not null,
  sexo                 char(1) not null check (sexo in ('M', 'F', 'O')),
  observacoes_medicas  text,
  data_ingresso        date not null,
  status               text not null default 'ATIVO'
                         check (status in ('ATIVO', 'INATIVO', 'ALTA', 'OBITO'))
);

create unique index if not exists un_residente_cpf on public.residente (cpf);
create index if not exists ix_residente_ilpi on public.residente (id_ilpi, status);

comment on column public.residente.observacoes_medicas is
  'Dado sensível de saúde (LGPD art. 11). Acesso restrito por RLS a família e equipe.';

-- FAMILIAR_RESIDENTE
create table if not exists public.familiar_residente (
  id_familiar_residente uuid primary key default gen_random_uuid(),
  id_usuario            uuid not null references public.usuario (id_usuario) on delete cascade,
  id_residente          uuid not null references public.residente (id_residente) on delete cascade,
  parentesco            text not null,
  responsavel_principal boolean not null default false,
  unique (id_usuario, id_residente)
);

create index if not exists ix_familiar_usuario on public.familiar_residente (id_usuario);
create index if not exists ix_familiar_residente on public.familiar_residente (id_residente);

-- ADESAO_ILPI — solicitação do familiar de entrar na casa
create table if not exists public.adesao_ilpi (
  id_adesao        uuid primary key default gen_random_uuid(),
  id_usuario       uuid not null references public.usuario (id_usuario) on delete cascade,
  id_ilpi          uuid not null references public.ilpi (id_ilpi) on delete cascade,
  status           text not null default 'PENDENTE'
                     check (status in ('PENDENTE', 'APROVADA', 'RECUSADA', 'CANCELADA')),
  data_solicitacao timestamptz not null default now(),
  data_resposta    timestamptz
);

create index if not exists ix_adesao_ilpi on public.adesao_ilpi (id_ilpi, status);
create index if not exists ix_adesao_usuario on public.adesao_ilpi (id_usuario);
-- no máximo uma solicitação pendente por casa
create unique index if not exists un_adesao_pendente
  on public.adesao_ilpi (id_usuario, id_ilpi) where status = 'PENDENTE';