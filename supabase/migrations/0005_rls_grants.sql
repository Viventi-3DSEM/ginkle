-- 0005 · RLS ligada, nada exposto por padrão, grant explícito
-- Cada tabela precisa de grant para a role E policy liberando a linha. Duas camadas.

alter table public.usuario             enable row level security;
alter table public.ilpi                enable row level security;
alter table public.foto_ilpi           enable row level security;
alter table public.plano               enable row level security;
alter table public.avaliacao           enable row level security;
alter table public.vinculo_ilpi        enable row level security;
alter table public.residente           enable row level security;
alter table public.familiar_residente  enable row level security;
alter table public.adesao_ilpi         enable row level security;
alter table public.registro_assistencial enable row level security;
alter table public.log_acao            enable row level security;
alter table public.conversa            enable row level security;
alter table public.mensagem            enable row level security;
alter table public.assinatura          enable row level security;
alter table public.faturamento         enable row level security;

-- Nada de privilégio herdado em tabela de auditoria e dados de saúde.
revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- ---- leitura pública (vitrine) ---------------------------------------------
grant select on
  public.ilpi,
  public.foto_ilpi,
  public.plano,
  public.avaliacao,
  public.ilpi_publica
to anon, authenticated;

-- ---- usuário logado ---------------------------------------------------------
-- update por coluna: cliente não troca e-mail nem CPF direto, só perfil
grant select on public.usuario to authenticated;
grant update (nome, telefone, data_nascimento) on public.usuario to authenticated;

grant insert, update, delete on public.avaliacao to authenticated;
grant select, insert, update on public.adesao_ilpi to authenticated;
grant select on public.vinculo_ilpi, public.residente, public.familiar_residente to authenticated;
grant select, insert on public.registro_assistencial to authenticated;
grant select on public.conversa, public.mensagem to authenticated;
grant insert on public.mensagem to authenticated;
grant select on public.assinatura, public.faturamento to authenticated;
-- log_acao: revogado. Só o servidor (service_role) escreve e lê.

-- quem cria casa/equipe/residente precisa de escrita; as policies filtram o quê
grant insert, update on public.ilpi to authenticated;
grant insert, update, delete on public.foto_ilpi, public.plano to authenticated;
grant insert, update, delete on public.vinculo_ilpi to authenticated;
grant insert, update on public.residente to authenticated;
grant insert, update, delete on public.familiar_residente to authenticated;

-- -----------------------------------------------------------------------------
-- Helper: o vínculo é do usuário logado?
-- -----------------------------------------------------------------------------
create or replace function public.eh_meu_vinculo(p_vinculo uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vinculo_ilpi v
    where v.id_vinculo = p_vinculo
      and v.id_usuario = auth.uid()
      and v.ativo
  );
$$;

-- -----------------------------------------------------------------------------
-- Helper: usuário é gestor de alguma casa? (usado no redirecionamento pós-login)
-- -----------------------------------------------------------------------------
create or replace function public.meu_cargo()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select v.cargo
  from public.vinculo_ilpi v
  where v.id_usuario = auth.uid() and v.ativo
  order by case v.cargo when 'GESTOR' then 0 else 1 end
  limit 1;
$$;

revoke all on function public.eh_meu_vinculo(uuid) from anon;
revoke all on function public.meu_cargo() from anon;