-- 0015 · escala de turnos da equipe e suporte completo ao chat equipe <-> familiar.
--
-- Dois blocos (idempotentes; não altera migrations antigas):
-- 1) `escala_turno`: tabela de escalas/turnos vinculada a `vinculo_ilpi`, com
--    leitura para a equipe da própria casa (para visualizar a própria escala e
--    a passagem de plantão) e escrita exclusiva para gestores da casa.
-- 2) Chat equipe <-> familiar:
--    - `usuario_equipe_le_chat`: permite que a equipe leia nome/contato (colunas
--      seguras da 0014, sem CPF/data de nascimento) de quem abriu conversa na casa.
--    - `conversa_cria`: além do próprio familiar abrir conversa, libera que a
--      equipe inicie conversa com familiares de residentes ou solicitantes da
--      própria casa (nunca com desconhecidos de fora).

-- ---- 1. escala_turno --------------------------------------------------------

create table if not exists public.escala_turno (
  id_escala   uuid primary key default gen_random_uuid(),
  id_vinculo  uuid not null references public.vinculo_ilpi (id_vinculo) on delete cascade,
  data        date not null,
  hora_inicio time not null,
  hora_fim    time not null,
  turno       text not null
                check (turno in ('MANHA', 'TARDE', 'NOITE', 'PLANTAO_12H', 'INTEGRAL')),
  observacoes text check (observacoes is null or length(observacoes) <= 500),
  criado_em   timestamptz not null default now()
);

create index if not exists ix_escala_vinculo_data
  on public.escala_turno (id_vinculo, data);

create index if not exists ix_escala_data
  on public.escala_turno (data);

alter table public.escala_turno enable row level security;

revoke all on public.escala_turno from anon, authenticated;
grant select, insert, update, delete on public.escala_turno to authenticated;

drop policy if exists escala_leitura on public.escala_turno;
create policy escala_leitura on public.escala_turno
  for select to authenticated
  using (
    public.eh_meu_vinculo(id_vinculo)
    or exists (
      select 1
      from public.vinculo_ilpi v
      where v.id_vinculo = escala_turno.id_vinculo
        and public.eh_equipe(v.id_ilpi)
    )
  );

drop policy if exists escala_gestor_gerencia on public.escala_turno;
create policy escala_gestor_gerencia on public.escala_turno
  for all to authenticated
  using (
    exists (
      select 1
      from public.vinculo_ilpi v
      where v.id_vinculo = escala_turno.id_vinculo
        and public.eh_gestor(v.id_ilpi)
    )
  )
  with check (
    exists (
      select 1
      from public.vinculo_ilpi v
      where v.id_vinculo = escala_turno.id_vinculo
        and public.eh_gestor(v.id_ilpi)
    )
  );

comment on table public.escala_turno is
  'Escala de plantões e turnos dos profissionais vinculados a cada ILPI.';

-- ---- 2. chat equipe <-> familiar --------------------------------------------

drop policy if exists usuario_equipe_le_chat on public.usuario;
create policy usuario_equipe_le_chat on public.usuario
  for select to authenticated
  using (
    exists (
      select 1
      from public.conversa c
      where c.id_usuario = usuario.id_usuario
        and public.eh_equipe(c.id_ilpi)
    )
  );

drop policy if exists conversa_cria on public.conversa;
create policy conversa_cria on public.conversa
  for insert to authenticated
  with check (
    id_usuario = auth.uid()
    or (
      public.eh_equipe(id_ilpi)
      and (
        exists (
          select 1
          from public.familiar_residente fr
          join public.residente r on r.id_residente = fr.id_residente
          where fr.id_usuario = conversa.id_usuario
            and r.id_ilpi = conversa.id_ilpi
        )
        or exists (
          select 1
          from public.adesao_ilpi a
          where a.id_usuario = conversa.id_usuario
            and a.id_ilpi = conversa.id_ilpi
        )
      )
    )
  );
