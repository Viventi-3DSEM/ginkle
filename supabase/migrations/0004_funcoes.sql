-- 0004 · funções de apoio, trigger de cadastro e view pública
-- SECURITY DEFINER de propósito: leem vinculo_ilpi ignorando RLS. Sem isso, a policy
-- que consulta vinculo_ilpi recursa (42P17).

-- -----------------------------------------------------------------------------
-- Perfil criado automaticamente quando alguém se cadastra no Supabase Auth.
-- Os campos extras vêm de raw_user_meta_data, enviados pelo formulário.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuario (id_usuario, nome, email, cpf, telefone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf', ''), '\D', '', 'g'), ''),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'telefone', ''), '\D', '', 'g'), '')
  )
  on conflict (id_usuario) do update
    set nome     = excluded.nome,
        email    = excluded.email,
        cpf      = coalesce(public.usuario.cpf, excluded.cpf),
        telefone = coalesce(public.usuario.telefone, excluded.telefone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Helpers de permissão (usados nas policies e no servidor)
-- -----------------------------------------------------------------------------

-- cargo do usuário logado na casa: 'GESTOR', 'FUNCIONARIO' ou null
create or replace function public.cargo_na_ilpi(p_ilpi uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select v.cargo
  from public.vinculo_ilpi v
  where v.id_ilpi = p_ilpi
    and v.id_usuario = auth.uid()
    and v.ativo
  limit 1;
$$;

create or replace function public.eh_gestor(p_ilpi uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.cargo_na_ilpi(p_ilpi) = 'GESTOR', false);
$$;

create or replace function public.eh_equipe(p_ilpi uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.cargo_na_ilpi(p_ilpi) is not null;
$$;

-- familiar do residente?
create or replace function public.eh_familiar_de(p_residente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.familiar_residente f
    where f.id_residente = p_residente
      and f.id_usuario = auth.uid()
  );
$$;

-- pode ver o residente: familiar vinculado ou equipe da casa dele
create or replace function public.pode_ver_residente(p_residente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.eh_familiar_de(p_residente)
      or exists (
        select 1
        from public.residente r
        join public.vinculo_ilpi v
          on v.id_ilpi = r.id_ilpi and v.id_usuario = auth.uid() and v.ativo
        where r.id_residente = p_residente
      );
$$;

-- -----------------------------------------------------------------------------
-- View pública do diretório: junta nota média, quantidade de avaliações,
-- mensalidade mais barata e a foto de capa. É o que /casas consome.
-- security_invoker = true para a RLS das tabelas base valer para quem consulta.
-- -----------------------------------------------------------------------------
drop view if exists public.ilpi_publica;
create view public.ilpi_publica
with (security_invoker = true)
as
select
  i.id_ilpi,
  i.slug,
  i.nome,
  i.descricao,
  i.endereco,
  i.cidade,
  i.bairro,
  i.uf,
  i.telefone,
  i.email,
  i.site,
  i.vagas,
  i.destaque,
  i.tags,
  i.data_cadastro,
  coalesce(round(avg(a.nota)::numeric, 1), 0)  as nota,
  count(a.id_avaliacao)                        as total_avaliacoes,
  min(p.valor)                                 as mensalidade,
  (select f.url
     from public.foto_ilpi f
    where f.id_ilpi = i.id_ilpi
    order by f.ordem, f.data_upload
    limit 1)                                   as capa_url
from public.ilpi i
left join public.avaliacao a on a.id_ilpi = i.id_ilpi
left join public.plano p on p.id_ilpi = i.id_ilpi and p.ativo
where i.publicado
group by i.id_ilpi;

comment on view public.ilpi_publica is
  'Perfil público agregado. Filtra publicado = true e roda com a RLS do chamador.';