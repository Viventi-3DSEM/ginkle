-- 0008 · views de leitura e RPC de criação de casa

-- -----------------------------------------------------------------------------
-- Avaliações com o nome de quem avaliou, sem expor e-mail/CPF.
-- security_invoker = false (padrão): a view roda como owner e lê usuario,
-- mas só devolve as colunas abaixo. O cliente nunca recebe a tabela usuario.
-- -----------------------------------------------------------------------------
drop view if exists public.avaliacao_publica;
create view public.avaliacao_publica as
select
  a.id_avaliacao,
  a.id_ilpi,
  a.nota,
  a.comentario,
  a.data_avaliacao,
  case
    when strpos(trim(u.nome), ' ') = 0 then trim(u.nome)
    else split_part(trim(u.nome), ' ', 1)
         || ' ' || left(split_part(trim(u.nome), ' ', -1), 1) || '.'
  end as autor
from public.avaliacao a
join public.usuario u on u.id_usuario = a.id_usuario
where exists (
  select 1 from public.ilpi i where i.id_ilpi = a.id_ilpi and i.publicado
);

grant select on public.avaliacao_publica to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Linha do tempo do residente já pronta para o Portal do Familiar:
-- junta o autor do registro, o cargo e sinaliza discrepância de relógio
-- (mais de 10 minutos entre o dispositivo e o servidor).
-- security_invoker = true: a RLS de registro_assistencial decide as linhas.
-- -----------------------------------------------------------------------------
drop view if exists public.registro_timeline;
create view public.registro_timeline
with (security_invoker = true)
as
select
  r.id_registro,
  r.id_residente,
  r.tipo,
  r.titulo,
  r.descricao,
  r.criado_em_dispositivo,
  r.sincronizado_em_servidor,
  (r.sincronizado_em_servidor - r.criado_em_dispositivo) > interval '10 minutes'
    as sincronizacao_atrasada,
  u.nome        as autor_nome,
  v.cargo       as autor_cargo
from public.registro_assistencial r
join public.vinculo_ilpi v on v.id_vinculo = r.id_vinculo
join public.usuario u      on u.id_usuario = v.id_usuario;

grant select on public.registro_timeline to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: cria a casa e o vínculo de gestor do usuário logado numa transação só.
-- Sem isso, a policy de INSERT em vinculo_ilpi (que exige ser gestor) nunca
-- deixaria o primeiro gestor entrar.
-- -----------------------------------------------------------------------------
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

  insert into public.log_acao (id_usuario, acao, entidade, id_entidade)
  values (v_user, 'ILPI_CRIADA', 'ilpi', v_id::text);

  return v_id;
end;
$$;

revoke all on function public.criar_ilpi(text, text, text, text, text, text, text, text, text, text, char) from anon;
grant execute on function public.criar_ilpi(text, text, text, text, text, text, text, text, text, text, char) to authenticated;