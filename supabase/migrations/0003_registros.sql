-- 0003 · registros assistenciais, auditoria, chat e financeiro

-- REGISTRO_ASSISTENCIAL — cuidado, medicamento, sinal vital ou ocorrência.
-- O duplo timestamp é o núcleo do antifraude: o dispositivo grava a hora real,
-- o servidor grava a hora de chegada (offline-first, item 8 do dossiê).
create table if not exists public.registro_assistencial (
  id_registro                uuid primary key default gen_random_uuid(),
  id_residente               uuid not null references public.residente (id_residente) on delete cascade,
  id_vinculo                 uuid not null references public.vinculo_ilpi (id_vinculo) on delete restrict,
  tipo                       text not null
                               check (tipo in ('CUIDADO', 'MEDICAMENTO', 'SINAL_VITAL', 'OCORRENCIA')),
  titulo                     text not null check (length(titulo) <= 100),
  descricao                  text not null,
  criado_em_dispositivo      timestamptz not null,
  sincronizado_em_servidor   timestamptz not null default now(),
  -- sinalização de discrepância de relógio (ver view registro_assistencial_auditado)
  constraint _ck_registro_futuro
    check (criado_em_dispositivo < sincronizado_em_servidor + interval '1 day')
);

create index if not exists ix_registro_residente
  on public.registro_assistencial (id_residente, criado_em_dispositivo desc);
create index if not exists ix_registro_vinculo
  on public.registro_assistencial (id_vinculo);

-- LOG_ACAO — trilha imutável. O cliente não tem INSERT: só o servidor escreve.
create table if not exists public.log_acao (
  id_log                   uuid primary key default gen_random_uuid(),
  id_usuario               uuid not null references public.usuario (id_usuario) on delete restrict,
  acao                     text not null,
  entidade                 text not null,
  id_entidade              text not null,
  criado_em_dispositivo    timestamptz not null default now(),
  sincronizado_em_servidor timestamptz not null default now()
);

create index if not exists ix_log_usuario on public.log_acao (id_usuario, criado_em_dispositivo desc);
create index if not exists ix_log_entidade on public.log_acao (entidade, id_entidade);

-- CONVERSA / MENSAGEM — chat familiar <-> casa
create table if not exists public.conversa (
  id_conversa  uuid primary key default gen_random_uuid(),
  id_ilpi      uuid not null references public.ilpi (id_ilpi) on delete cascade,
  id_usuario   uuid not null references public.usuario (id_usuario) on delete cascade,
  data_criacao timestamptz not null default now(),
  unique (id_ilpi, id_usuario)
);

create table if not exists public.mensagem (
  id_mensagem uuid primary key default gen_random_uuid(),
  id_conversa uuid not null references public.conversa (id_conversa) on delete cascade,
  id_usuario  uuid not null references public.usuario (id_usuario) on delete restrict,
  conteudo    text not null check (length(trim(conteudo)) > 0),
  data_hora   timestamptz not null default now()
);

create index if not exists ix_mensagem_conversa on public.mensagem (id_conversa, data_hora);

-- ASSINATURA / FATURAMENTO
create table if not exists public.assinatura (
  id_assinatura uuid primary key default gen_random_uuid(),
  id_usuario    uuid not null references public.usuario (id_usuario) on delete restrict,
  id_plano      uuid not null references public.plano (id_plano) on delete restrict,
  status        text not null default 'ATIVA'
                  check (status in ('ATIVA', 'SUSPENSA', 'CANCELADA')),
  data_inicio   date not null,
  data_fim      date
);

create index if not exists ix_assinatura_usuario on public.assinatura (id_usuario);
-- uma assinatura ativa por usuário
create unique index if not exists un_assinatura_ativa
  on public.assinatura (id_usuario) where status = 'ATIVA';

create table if not exists public.faturamento (
  id_faturamento    uuid primary key default gen_random_uuid(),
  id_assinatura     uuid not null references public.assinatura (id_assinatura) on delete cascade,
  valor             numeric(10, 2) not null check (valor >= 0),
  data_vencimento   date not null,
  data_pagamento    date,
  status_pagamento  text not null default 'PENDENTE'
                      check (status_pagamento in ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO')),
  constraint _ck_fatura_paga check (status_pagamento <> 'PAGO' or data_pagamento is not null)
);

create index if not exists ix_faturamento_assinatura on public.faturamento (id_assinatura, data_vencimento);