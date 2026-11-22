-- 0012 · libera o restante do Painel do Gestor sem abrir mão do isolamento entre casas.
--
-- Quatro blocos:
-- 1) `usuario`: a equipe lê o nome/contato de quem enviou solicitação de entrada
--    (`adesao_ilpi`), colegas mesmo quando desativados (para poder reativar na
--    tela de equipe) e assinantes das próprias casas.
-- 2) RPCs `vincular_equipe_por_email` e `vincular_familiar_por_email`: permitem
--    adicionar funcionário ou familiar por e-mail sem expor a tabela `usuario`
--    para busca aberta.
-- 3) `assinatura` e `faturamento`: o gestor gerencia assinantes e faturas das
--    próprias casas (sem DELETE — financeiro nunca apaga histórico), e o
--    familiar segue vendo o plano/faturas da própria assinatura mesmo se o
--    plano for desativado depois.
-- 4) `log_acao`: ganha `id_ilpi` e `detalhes`, continua append-only (sem INSERT,
--    UPDATE nem DELETE para `authenticated`), é preenchida por trigger no banco
--    e fica legível apenas para o gestor da casa correspondente.

-- ---- 1. leitura de usuario pela equipe / gestor da casa ---------------------

-- Corrige a 0009 para manter visível o nome de colegas desativados da mesma
-- casa (senão, ao desativar um profissional, o nome dele some da tela). Quem
-- foi desativado (`meu.ativo = false`) continua sem enxergar ninguém.
drop policy if exists usuario_equipe_le_equipe on public.usuario;
create policy usuario_equipe_le_equipe on public.usuario
  for select to authenticated
  using (
    exists (
      select 1
      from public.vinculo_ilpi meu
      join public.vinculo_ilpi colega on colega.id_ilpi = meu.id_ilpi
      where meu.id_usuario = auth.uid()
        and meu.ativo
        and colega.id_usuario = usuario.id_usuario
    )
  );

-- Quem pediu entrada na casa (adesao_ilpi) fica legível para a equipe da casa.
drop policy if exists usuario_equipe_le_solicitantes on public.usuario;
create policy usuario_equipe_le_solicitantes on public.usuario
  for select to authenticated
  using (
    exists (
      select 1
      from public.adesao_ilpi a
      where a.id_usuario = usuario.id_usuario
        and public.eh_equipe(a.id_ilpi)
    )
  );

-- Assinantes de planos da casa seguem legíveis para o gestor mesmo sem vínculo
-- ativo de residente (preserva o histórico financeiro).
drop policy if exists usuario_gestor_le_assinantes on public.usuario;
create policy usuario_gestor_le_assinantes on public.usuario
  for select to authenticated
  using (
    exists (
      select 1
      from public.assinatura a
      join public.plano p on p.id_plano = a.id_plano
      where a.id_usuario = usuario.id_usuario
        and public.eh_gestor(p.id_ilpi)
    )
  );

-- ---- 2. RPCs para vincular equipe e familiar por e-mail ---------------------

create or replace function public.vincular_equipe_por_email(
  p_ilpi  uuid,
  p_email text,
  p_cargo text default 'FUNCIONARIO'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_alvo    uuid;
  v_vinculo uuid;
begin
  if v_uid is null then
    raise exception 'É preciso estar autenticado.' using errcode = '28000';
  end if;

  if not public.eh_gestor(p_ilpi) then
    raise exception 'Apenas gestores podem gerenciar a equipe desta casa.' using errcode = '42501';
  end if;

  if p_cargo not in ('GESTOR', 'FUNCIONARIO') then
    raise exception 'Cargo inválido.' using errcode = '22023';
  end if;

  select u.id_usuario
    into v_alvo
    from public.usuario u
   where lower(u.email) = lower(trim(coalesce(p_email, '')))
   limit 1;

  if v_alvo is null then
    raise exception 'Nenhuma conta encontrada com esse e-mail.' using errcode = 'P0002';
  end if;

  if v_alvo = v_uid then
    raise exception 'Você já faz parte da equipe desta casa.' using errcode = '22023';
  end if;

  insert into public.vinculo_ilpi (id_usuario, id_ilpi, cargo, ativo)
  values (v_alvo, p_ilpi, p_cargo, true)
  on conflict (id_usuario, id_ilpi) do update
    set cargo = excluded.cargo,
        ativo = true
  returning id_vinculo into v_vinculo;

  return v_vinculo;
end;
$$;

create or replace function public.vincular_familiar_por_email(
  p_residente             uuid,
  p_email                 text,
  p_parentesco            text,
  p_responsavel_principal boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_ilpi       uuid;
  v_alvo       uuid;
  v_vinculo    uuid;
  v_parentesco text := trim(coalesce(p_parentesco, ''));
begin
  if v_uid is null then
    raise exception 'É preciso estar autenticado.' using errcode = '28000';
  end if;

  select r.id_ilpi
    into v_ilpi
    from public.residente r
   where r.id_residente = p_residente;

  if v_ilpi is null or not public.eh_equipe(v_ilpi) then
    raise exception 'Você não tem permissão para vincular familiares a este residente.' using errcode = '42501';
  end if;

  if length(v_parentesco) < 2 or length(v_parentesco) > 60 then
    raise exception 'Informe o parentesco (entre 2 e 60 caracteres).' using errcode = '22023';
  end if;

  select u.id_usuario
    into v_alvo
    from public.usuario u
   where lower(u.email) = lower(trim(coalesce(p_email, '')))
   limit 1;

  if v_alvo is null then
    raise exception 'Nenhuma conta encontrada com esse e-mail.' using errcode = 'P0002';
  end if;

  insert into public.familiar_residente (id_usuario, id_residente, parentesco, responsavel_principal)
  values (v_alvo, p_residente, v_parentesco, coalesce(p_responsavel_principal, false))
  on conflict (id_usuario, id_residente) do update
    set parentesco = excluded.parentesco,
        responsavel_principal = excluded.responsavel_principal
  returning id_familiar_residente into v_vinculo;

  return v_vinculo;
end;
$$;

-- ---- 3. financeiro / assinantes do gestor + leitura segura pelo familiar ----

-- Helper definer evita recursão (42P17) quando `plano_leitura_equipe` checa
-- se o usuário logado tem assinatura no plano (permite ao familiar ler o nome
-- do próprio plano mesmo depois de o plano ser desativado ou a casa ficar privada).
create or replace function public.eh_assinante_do_plano(p_plano uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assinatura a
    where a.id_plano = p_plano
      and a.id_usuario = auth.uid()
  );
$$;

drop policy if exists plano_leitura_equipe on public.plano;
create policy plano_leitura_equipe on public.plano
  for select to authenticated
  using (
    public.eh_equipe(id_ilpi)
    or public.eh_assinante_do_plano(id_plano)
    or (
      ativo
      and exists (
        select 1 from public.ilpi i
        where i.id_ilpi = plano.id_ilpi and i.publicado
      )
    )
  );

-- Sem DELETE: histórico financeiro só muda de status (CANCELADA / CANCELADO).
grant insert, update on public.assinatura, public.faturamento to authenticated;

drop policy if exists assinatura_leitura on public.assinatura;
create policy assinatura_leitura on public.assinatura
  for select to authenticated
  using (
    id_usuario = auth.uid()
    or exists (
      select 1
      from public.plano p
      where p.id_plano = assinatura.id_plano
        and public.eh_gestor(p.id_ilpi)
    )
  );

-- O gestor só vincula assinatura a plano da própria casa e para alguém que já
-- tem relação com ela (familiar de residente ou solicitante em adesao_ilpi).
drop policy if exists assinatura_gestor_cria on public.assinatura;
create policy assinatura_gestor_cria on public.assinatura
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.plano p
      where p.id_plano = assinatura.id_plano
        and public.eh_gestor(p.id_ilpi)
        and (
          exists (
            select 1
            from public.familiar_residente fr
            join public.residente r on r.id_residente = fr.id_residente
            where fr.id_usuario = assinatura.id_usuario
              and r.id_ilpi = p.id_ilpi
          )
          or exists (
            select 1
            from public.adesao_ilpi a
            where a.id_usuario = assinatura.id_usuario
              and a.id_ilpi = p.id_ilpi
          )
        )
    )
  );

drop policy if exists assinatura_gestor_edita on public.assinatura;
create policy assinatura_gestor_edita on public.assinatura
  for update to authenticated
  using (
    exists (
      select 1
      from public.plano p
      where p.id_plano = assinatura.id_plano
        and public.eh_gestor(p.id_ilpi)
    )
  )
  with check (
    exists (
      select 1
      from public.plano p
      where p.id_plano = assinatura.id_plano
        and public.eh_gestor(p.id_ilpi)
        and (
          exists (
            select 1
            from public.familiar_residente fr
            join public.residente r on r.id_residente = fr.id_residente
            where fr.id_usuario = assinatura.id_usuario
              and r.id_ilpi = p.id_ilpi
          )
          or exists (
            select 1
            from public.adesao_ilpi a
            where a.id_usuario = assinatura.id_usuario
              and a.id_ilpi = p.id_ilpi
          )
        )
    )
  );

-- Dois ramos separados: o primeiro garante que o familiar continua vendo as
-- próprias faturas sem passar pela RLS de `plano`.
drop policy if exists faturamento_leitura on public.faturamento;
create policy faturamento_leitura on public.faturamento
  for select to authenticated
  using (
    exists (
      select 1
      from public.assinatura a
      where a.id_assinatura = faturamento.id_assinatura
        and a.id_usuario = auth.uid()
    )
    or exists (
      select 1
      from public.assinatura a
      join public.plano p on p.id_plano = a.id_plano
      where a.id_assinatura = faturamento.id_assinatura
        and public.eh_gestor(p.id_ilpi)
    )
  );

drop policy if exists faturamento_gestor_cria on public.faturamento;
create policy faturamento_gestor_cria on public.faturamento
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.assinatura a
      join public.plano p on p.id_plano = a.id_plano
      where a.id_assinatura = faturamento.id_assinatura
        and public.eh_gestor(p.id_ilpi)
    )
  );

drop policy if exists faturamento_gestor_edita on public.faturamento;
create policy faturamento_gestor_edita on public.faturamento
  for update to authenticated
  using (
    exists (
      select 1
      from public.assinatura a
      join public.plano p on p.id_plano = a.id_plano
      where a.id_assinatura = faturamento.id_assinatura
        and public.eh_gestor(p.id_ilpi)
    )
  )
  with check (
    exists (
      select 1
      from public.assinatura a
      join public.plano p on p.id_plano = a.id_plano
      where a.id_assinatura = faturamento.id_assinatura
        and public.eh_gestor(p.id_ilpi)
    )
  );

-- ---- 4. auditoria (`log_acao`) escopada por casa e append-only --------------

alter table public.log_acao
  add column if not exists id_ilpi uuid references public.ilpi (id_ilpi) on delete cascade;

alter table public.log_acao
  add column if not exists detalhes text;

create index if not exists ix_log_ilpi
  on public.log_acao (id_ilpi, criado_em_dispositivo desc);

-- Preenche id_ilpi nos logs antigos de ILPI_CRIADA (validando UUID e existência).
update public.log_acao l
set id_ilpi  = i.id_ilpi,
    detalhes = coalesce(l.detalhes, i.nome)
from public.ilpi i
where l.id_ilpi is null
  and l.entidade = 'ilpi'
  and l.id_entidade ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and i.id_ilpi = l.id_entidade::uuid;

-- Somente leitura para o gestor da casa; sem INSERT/UPDATE/DELETE direto pela API.
revoke insert, update, delete on public.log_acao from anon, authenticated;
grant select on public.log_acao to authenticated;

drop policy if exists log_gestor_leitura on public.log_acao;
create policy log_gestor_leitura on public.log_acao
  for select to authenticated
  using (id_ilpi is not null and public.eh_gestor(id_ilpi));

-- Atualiza criar_ilpi() para já gravar id_ilpi e detalhes no log.
create or replace function public.criar_ilpi(
  p_slug       text,
  p_cnpj       text,
  p_nome       text,
  p_telefone   text,
  p_email      text,
  p_endereco   text,
  p_cidade     text,
  p_bairro     text,
  p_descricao  text default null,
  p_site       text default null,
  p_uf         char(2) default 'SP'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'É preciso estar autenticado.' using errcode = '28000';
  end if;

  insert into public.ilpi (slug, cnpj, nome, telefone, email, descricao, site, endereco, cidade, bairro, uf)
  values (p_slug, p_cnpj, p_nome, p_telefone, p_email, p_descricao, p_site, p_endereco, p_cidade, p_bairro, p_uf)
  returning id_ilpi into v_id;

  insert into public.vinculo_ilpi (id_usuario, id_ilpi, cargo)
  values (v_user, v_id, 'GESTOR');

  insert into public.log_acao (id_usuario, id_ilpi, acao, entidade, id_entidade, detalhes)
  values (v_user, v_id, 'ILPI_CRIADA', 'ilpi', v_id::text, left(p_nome, 500));

  return v_id;
end;
$$;

-- Trigger de auditoria automática: grava ações feitas por usuários autenticados
-- sem precisar conceder INSERT em log_acao. Ações no SQL Editor (auth.uid() null)
-- são ignoradas para não atrapalhar seeds nem limpezas.
create or replace function public.auditar_mudanca()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_ilpi        uuid;
  v_acao        text;
  v_entidade    text := tg_table_name;
  v_id_entidade text;
  v_detalhes    text;
  v_nome_u      text;
  v_nome_extra  text;
begin
  if v_uid is null then
    return coalesce(new, old);
  end if;

  if tg_table_name = 'ilpi' and tg_op = 'UPDATE' then
    v_ilpi := new.id_ilpi;
    v_id_entidade := new.id_ilpi::text;
    v_detalhes := new.nome;
    if new.publicado is distinct from old.publicado
       and new.nome = old.nome
       and new.slug = old.slug
       and new.vagas = old.vagas
       and new.telefone = old.telefone
       and new.email = old.email
       and new.endereco = old.endereco then
      v_acao := case when new.publicado then 'ILPI_PUBLICADA' else 'ILPI_PRIVADA' end;
    else
      v_acao := 'ILPI_ATUALIZADA';
    end if;

  elsif tg_table_name = 'plano' then
    if tg_op = 'INSERT' then
      v_ilpi := new.id_ilpi;
      v_id_entidade := new.id_plano::text;
      v_acao := 'PLANO_CRIADO';
      v_detalhes := new.nome;
    elsif tg_op = 'UPDATE' then
      v_ilpi := new.id_ilpi;
      v_id_entidade := new.id_plano::text;
      v_detalhes := new.nome;
      if new.ativo is distinct from old.ativo
         and new.nome = old.nome
         and new.valor = old.valor
         and new.descricao is not distinct from old.descricao then
        v_acao := case when new.ativo then 'PLANO_ATIVADO' else 'PLANO_DESATIVADO' end;
      else
        v_acao := 'PLANO_ATUALIZADO';
      end if;
    elsif tg_op = 'DELETE' then
      v_ilpi := old.id_ilpi;
      v_id_entidade := old.id_plano::text;
      v_acao := 'PLANO_EXCLUIDO';
      v_detalhes := old.nome;
    end if;

  elsif tg_table_name = 'residente' then
    v_ilpi := new.id_ilpi;
    v_id_entidade := new.id_residente::text;
    if tg_op = 'INSERT' then
      v_acao := 'RESIDENTE_CADASTRADO';
      v_detalhes := new.nome;
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status then
        v_acao := 'RESIDENTE_STATUS';
        v_detalhes := new.nome || ' (' || old.status || ' → ' || new.status || ')';
      else
        v_acao := 'RESIDENTE_ATUALIZADO';
        v_detalhes := new.nome;
      end if;
    end if;

  elsif tg_table_name = 'vinculo_ilpi' then
    select u.nome into v_nome_u
      from public.usuario u
     where u.id_usuario = coalesce(new.id_usuario, old.id_usuario);

    if tg_op = 'INSERT' then
      -- Evita duplicar log no momento da criação da casa (criar_ilpi já registra ILPI_CRIADA).
      if new.id_usuario = v_uid
         and new.cargo = 'GESTOR'
         and not exists (
           select 1 from public.vinculo_ilpi v
            where v.id_ilpi = new.id_ilpi and v.id_vinculo <> new.id_vinculo
         ) then
        return new;
      end if;
      v_ilpi := new.id_ilpi;
      v_id_entidade := new.id_vinculo::text;
      v_acao := 'EQUIPE_ADICIONADA';
      v_detalhes := coalesce(v_nome_u, 'Profissional') || ' (' || new.cargo || ')';
    elsif tg_op = 'UPDATE' then
      v_ilpi := new.id_ilpi;
      v_id_entidade := new.id_vinculo::text;
      if new.ativo is distinct from old.ativo then
        v_acao := case when new.ativo then 'EQUIPE_ATIVADA' else 'EQUIPE_DESATIVADA' end;
        v_detalhes := coalesce(v_nome_u, 'Profissional') || ' (' || new.cargo || ')';
      elsif new.cargo is distinct from old.cargo then
        v_acao := 'EQUIPE_CARGO_ALTERADO';
        v_detalhes := coalesce(v_nome_u, 'Profissional') || ' (' || old.cargo || ' → ' || new.cargo || ')';
      else
        return new;
      end if;
    elsif tg_op = 'DELETE' then
      v_ilpi := old.id_ilpi;
      v_id_entidade := old.id_vinculo::text;
      v_acao := 'EQUIPE_REMOVIDA';
      v_detalhes := coalesce(v_nome_u, 'Profissional') || ' (' || old.cargo || ')';
    end if;

  elsif tg_table_name = 'familiar_residente' then
    select r.id_ilpi, r.nome
      into v_ilpi, v_nome_extra
      from public.residente r
     where r.id_residente = coalesce(new.id_residente, old.id_residente);

    if v_ilpi is null then
      return coalesce(new, old);
    end if;

    select u.nome into v_nome_u
      from public.usuario u
     where u.id_usuario = coalesce(new.id_usuario, old.id_usuario);

    v_id_entidade := coalesce(new.id_familiar_residente, old.id_familiar_residente)::text;
    if tg_op = 'INSERT' then
      v_acao := 'FAMILIAR_VINCULADO';
      v_detalhes := coalesce(v_nome_u, 'Familiar') || ' → ' || coalesce(v_nome_extra, 'Residente') || ' (' || new.parentesco || ')';
    elsif tg_op = 'UPDATE' then
      v_acao := 'FAMILIAR_ATUALIZADO';
      v_detalhes := coalesce(v_nome_u, 'Familiar') || ' → ' || coalesce(v_nome_extra, 'Residente') || ' (' || new.parentesco || ')';
    elsif tg_op = 'DELETE' then
      v_acao := 'FAMILIAR_REMOVIDO';
      v_detalhes := coalesce(v_nome_u, 'Familiar') || ' → ' || coalesce(v_nome_extra, 'Residente');
    end if;

  elsif tg_table_name = 'adesao_ilpi' and tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return new;
    end if;
    select u.nome into v_nome_u from public.usuario u where u.id_usuario = new.id_usuario;
    v_ilpi := new.id_ilpi;
    v_id_entidade := new.id_adesao::text;
    v_acao := 'ADESAO_' || new.status;
    v_detalhes := coalesce(v_nome_u, 'Solicitante');

  elsif tg_table_name = 'assinatura' then
    select p.id_ilpi, p.nome
      into v_ilpi, v_nome_extra
      from public.plano p
     where p.id_plano = new.id_plano;
    select u.nome into v_nome_u from public.usuario u where u.id_usuario = new.id_usuario;
    v_id_entidade := new.id_assinatura::text;
    if tg_op = 'INSERT' then
      v_acao := 'ASSINATURA_CRIADA';
      v_detalhes := coalesce(v_nome_u, 'Assinante') || ' · ' || coalesce(v_nome_extra, 'Plano');
    elsif tg_op = 'UPDATE' then
      v_acao := 'ASSINATURA_ATUALIZADA';
      v_detalhes := coalesce(v_nome_u, 'Assinante') || ' · ' || coalesce(v_nome_extra, 'Plano') || ' (' || new.status || ')';
    end if;

  elsif tg_table_name = 'faturamento' then
    select p.id_ilpi, u.nome
      into v_ilpi, v_nome_u
      from public.assinatura a
      join public.plano p on p.id_plano = a.id_plano
      join public.usuario u on u.id_usuario = a.id_usuario
     where a.id_assinatura = new.id_assinatura;
    v_id_entidade := new.id_faturamento::text;
    if tg_op = 'INSERT' then
      v_acao := 'FATURA_CRIADA';
      v_detalhes := coalesce(v_nome_u, 'Assinante') || ' · venc. ' || to_char(new.data_vencimento, 'DD/MM/YYYY');
    elsif tg_op = 'UPDATE' then
      if new.status_pagamento is distinct from old.status_pagamento then
        v_acao := 'FATURA_STATUS';
        v_detalhes := coalesce(v_nome_u, 'Assinante') || ' (' || old.status_pagamento || ' → ' || new.status_pagamento || ')';
      else
        v_acao := 'FATURA_ATUALIZADA';
        v_detalhes := coalesce(v_nome_u, 'Assinante');
      end if;
    end if;
  end if;

  if v_acao is not null and v_ilpi is not null then
    insert into public.log_acao (id_usuario, id_ilpi, acao, entidade, id_entidade, detalhes)
    values (v_uid, v_ilpi, v_acao, v_entidade, coalesce(v_id_entidade, ''), left(v_detalhes, 500));
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_ilpi on public.ilpi;
create trigger trg_audit_ilpi
  after update on public.ilpi
  for each row execute function public.auditar_mudanca();

drop trigger if exists trg_audit_plano on public.plano;
create trigger trg_audit_plano
  after insert or update or delete on public.plano
  for each row execute function public.auditar_mudanca();

drop trigger if exists trg_audit_residente on public.residente;
create trigger trg_audit_residente
  after insert or update on public.residente
  for each row execute function public.auditar_mudanca();

drop trigger if exists trg_audit_vinculo_ilpi on public.vinculo_ilpi;
create trigger trg_audit_vinculo_ilpi
  after insert or update or delete on public.vinculo_ilpi
  for each row execute function public.auditar_mudanca();

drop trigger if exists trg_audit_familiar_residente on public.familiar_residente;
create trigger trg_audit_familiar_residente
  after insert or update or delete on public.familiar_residente
  for each row execute function public.auditar_mudanca();

drop trigger if exists trg_audit_adesao_ilpi on public.adesao_ilpi;
create trigger trg_audit_adesao_ilpi
  after update on public.adesao_ilpi
  for each row execute function public.auditar_mudanca();

drop trigger if exists trg_audit_assinatura on public.assinatura;
create trigger trg_audit_assinatura
  after insert or update on public.assinatura
  for each row execute function public.auditar_mudanca();

drop trigger if exists trg_audit_faturamento on public.faturamento;
create trigger trg_audit_faturamento
  after insert or update on public.faturamento
  for each row execute function public.auditar_mudanca();

-- ---- 5. EXECUTE das funções novas / atualizadas -----------------------------

revoke execute on function public.eh_assinante_do_plano(uuid) from public, anon;
grant  execute on function public.eh_assinante_do_plano(uuid) to authenticated;

revoke execute on function public.vincular_equipe_por_email(uuid, text, text) from public, anon;
grant  execute on function public.vincular_equipe_por_email(uuid, text, text) to authenticated;

revoke execute on function public.vincular_familiar_por_email(uuid, text, text, boolean) from public, anon;
grant  execute on function public.vincular_familiar_por_email(uuid, text, text, boolean) to authenticated;

revoke execute on function public.criar_ilpi(
  text, text, text, text, text, text, text, text, text, text, char
) from public, anon;
grant execute on function public.criar_ilpi(
  text, text, text, text, text, text, text, text, text, text, char
) to authenticated;

-- Função de trigger não precisa de EXECUTE para nenhum papel da API.
revoke execute on function public.auditar_mudanca() from public, anon, authenticated;

comment on function public.vincular_equipe_por_email(uuid, text, text) is
  'Permite ao gestor adicionar ou reativar um profissional por e-mail sem expor busca aberta em usuario.';
comment on function public.vincular_familiar_por_email(uuid, text, text, boolean) is
  'Permite à equipe vincular um familiar a um residente por e-mail sem expor busca aberta em usuario.';
comment on function public.eh_assinante_do_plano(uuid) is
  'true quando o usuário tem assinatura no plano; permite ao familiar ver o nome do próprio plano mesmo se desativado.';
comment on function public.auditar_mudanca() is
  'Trigger append-only de auditoria: grava ações autenticadas em log_acao com id_ilpi sem conceder INSERT na tabela.';
