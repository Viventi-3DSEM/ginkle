-- 0016 · habilita Supabase Realtime (Postgres Changes) para o chat em tempo real.
--
-- Idempotente: adiciona `public.mensagem` e `public.conversa` à publicação
-- `supabase_realtime` somente se ainda não estiverem incluídas.
-- A RLS existente continua valendo no Realtime: cada cliente autenticado só
-- recebe eventos das conversas que tem permissão de ler.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'mensagem'
    ) then
      alter publication supabase_realtime add table public.mensagem;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'conversa'
    ) then
      alter publication supabase_realtime add table public.conversa;
    end if;
  end if;
end;
$$;
