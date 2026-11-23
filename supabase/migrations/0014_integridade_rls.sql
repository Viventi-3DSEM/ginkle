-- 0014 · integridade de auditoria, LGPD em usuario, correção de views e RLS.
--
-- Seis blocos (todos idempotentes; não altera migrations antigas):
-- 1) `ilpi_publica`: corrige produto cartesiano entre `avaliacao` e `plano`
--    (antes `count(a.id_avaliacao)` era multiplicado pela qtd de planos ativos).
-- 2) `avaliacao_leitura` e `avaliacao_publica`: equipe/gestor continuam vendo
--    as avaliações da própria casa mesmo quando ela está privada (rascunho);
--    `anon` segue vendo apenas casas publicadas.
-- 3) `assinatura_gestor_edita`: libera atualização de status/fim mesmo depois
--    que o vínculo em `familiar_residente` foi removido (alta/óbito), travando
--    `id_usuario` contra alteração via privilégio por coluna.
-- 4) `adesao_solicita`: exige `ilpi.publicado` também no banco (antes a trava
--    estava apenas na Server Action).
-- 5) LGPD em `public.usuario`: revoga `SELECT` amplo de `authenticated` e
--    concede apenas colunas não-sensíveis (escondendo `cpf` e `data_nascimento`
--    de terceiros); o próprio usuário lê o perfil completo pela RPC `meu_perfil()`.
-- 6) Antifraude em `registro_assistencial`: revoga `INSERT` em
--    `sincronizado_em_servidor` para `authenticated` e impõe trigger BEFORE INSERT
--    que força `now()` em toda chamada autenticada pela API (mantendo o SQL Editor
--    livre para scripts administrativos).

-- ---- 1. ilpi_publica sem produto cartesiano ---------------------------------

create or replace view public.ilpi_publica
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
  coalesce(
    (select round(avg(a.nota)::numeric, 1)
       from public.avaliacao a
      where a.id_ilpi = i.id_ilpi),
    0
  ) as nota,
  (select count(*)
     from public.avaliacao a
    where a.id_ilpi = i.id_ilpi) as total_avaliacoes,
  (select min(p.valor)
     from public.plano p
    where p.id_ilpi = i.id_ilpi and p.ativo) as mensalidade,
  (select f.url
     from public.foto_ilpi f
    where f.id_ilpi = i.id_ilpi
    order by f.ordem, f.data_upload
    limit 1) as capa_url
from public.ilpi i
where i.publicado;

grant select on public.ilpi_publica to anon, authenticated;

comment on view public.ilpi_publica is
  'Perfil público agregado sem produto cartesiano entre avaliações e planos. Filtra publicado = true e roda com a RLS do chamador.';

-- ---- 2. avaliações da casa privada visíveis para a própria equipe -----------

drop policy if exists avaliacao_leitura on public.avaliacao;
create policy avaliacao_leitura on public.avaliacao
  for select to authenticated
  using (
    id_usuario = auth.uid()
    or public.eh_equipe(id_ilpi)
    or exists (
      select 1 from public.ilpi i
      where i.id_ilpi = avaliacao.id_ilpi and i.publicado
    )
  );

-- View definer: roda como owner para ler `usuario` e `vinculo_ilpi` sem expor
-- essas tabelas. Evita chamar `eh_equipe()` diretamente porque no Postgres o
-- EXECUTE de funções em views é checado no papel chamador (revogado para `anon`).
create or replace view public.avaliacao_publica as
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
  select 1 from public.ilpi i
  where i.id_ilpi = a.id_ilpi
    and (
      i.publicado
      or (
        auth.uid() is not null
        and exists (
          select 1 from public.vinculo_ilpi v
          where v.id_ilpi = i.id_ilpi
            and v.id_usuario = auth.uid()
            and v.ativo
        )
      )
    )
);

grant select on public.avaliacao_publica to anon, authenticated;

-- ---- 3. assinatura: cancelar/gerenciar mesmo após desvincular familiar ------

-- Impede trocar o assinante (`id_usuario`) de uma assinatura já criada.
revoke update on public.assinatura from authenticated;
grant update (id_plano, status, data_inicio, data_fim) on public.assinatura to authenticated;

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
    )
  );

-- ---- 4. adesao_solicita exige casa publicada no banco -----------------------

drop policy if exists adesao_solicita on public.adesao_ilpi;
create policy adesao_solicita on public.adesao_ilpi
  for insert to authenticated
  with check (
    id_usuario = auth.uid()
    and status = 'PENDENTE'
    and exists (
      select 1 from public.ilpi i
      where i.id_ilpi = adesao_ilpi.id_ilpi
        and i.publicado
    )
  );

-- ---- 5. LGPD em public.usuario: restringe cpf e data_nascimento -------------

-- Terceiros (equipe, colegas, gestores) só podem ler dados de identificação e
-- contato estritamente necessários; CPF e data de nascimento ficam fora do SELECT.
revoke select on public.usuario from authenticated;
grant select (id_usuario, nome, email, telefone, avatar_url, data_cadastro)
  on public.usuario to authenticated;

-- Mantém update por coluna apenas nos campos editáveis do próprio perfil.
revoke update on public.usuario from authenticated;
grant update (nome, telefone, data_nascimento, avatar_url)
  on public.usuario to authenticated;

create or replace function public.meu_perfil()
returns table (
  id_usuario      uuid,
  nome            text,
  email           text,
  cpf             text,
  telefone        text,
  data_nascimento date,
  avatar_url      text,
  data_cadastro   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id_usuario,
    u.nome,
    u.email,
    u.cpf,
    u.telefone,
    u.data_nascimento,
    u.avatar_url,
    u.data_cadastro
  from public.usuario u
  where u.id_usuario = auth.uid()
  limit 1;
$$;

revoke execute on function public.meu_perfil() from public, anon;
grant  execute on function public.meu_perfil() to authenticated;

comment on function public.meu_perfil() is
  'Retorna o perfil completo (incluindo CPF e data de nascimento) exclusivamente do usuário autenticado.';

-- ---- 6. antifraude: trava sincronizado_em_servidor em registro_assistencial -

-- Cliente autenticado não pode informar sincronizado_em_servidor no INSERT.
revoke insert on public.registro_assistencial from authenticated;
grant insert (
  id_registro,
  id_residente,
  id_vinculo,
  tipo,
  titulo,
  descricao,
  criado_em_dispositivo
) on public.registro_assistencial to authenticated;

create or replace function public.forcar_sincronizado_em_servidor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Em chamadas autenticadas pela API (auth.uid() preenchido), o carimbo do
  -- servidor é sempre gerado no banco, impedindo falsificação retroativa.
  -- No SQL Editor administrativo (auth.uid() nulo), respeita valor informado.
  if auth.uid() is not null then
    new.sincronizado_em_servidor := now();
  else
    new.sincronizado_em_servidor := coalesce(new.sincronizado_em_servidor, now());
  end if;
  return new;
end;
$$;

revoke execute on function public.forcar_sincronizado_em_servidor() from public, anon, authenticated;

drop trigger if exists trg_registro_forca_sincronizado on public.registro_assistencial;
create trigger trg_registro_forca_sincronizado
  before insert on public.registro_assistencial
  for each row execute function public.forcar_sincronizado_em_servidor();

comment on function public.forcar_sincronizado_em_servidor() is
  'Trigger antifraude: garante que sincronizado_em_servidor seja sempre now() para inserts autenticados via API.';
