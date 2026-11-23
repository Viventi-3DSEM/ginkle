-- 0013 · foto de perfil em usuario + buckets de imagens no Supabase Storage.
--
-- Dois blocos:
-- 1) `usuario.avatar_url`: coluna opcional para foto de perfil com validação de
--    URL segura e grant de UPDATE restrito (sem abrir e-mail nem CPF).
-- 2) Supabase Storage: cria os buckets públicos `fotos-casas` (5 MB) e `avatares`
--    (2 MB) e restringe leitura de listagem/escrita/remoção em `storage.objects`
--    por pasta (`<id_ilpi>/<arquivo>` só para gestor da casa; `<id_usuario>/<arquivo>`
--    só para o próprio usuário).

-- ---- 1. avatar_url em public.usuario ----------------------------------------

alter table public.usuario
  add column if not exists avatar_url text;

alter table public.usuario
  drop constraint if exists _ck_usuario_avatar_url;
alter table public.usuario
  add constraint _ck_usuario_avatar_url
    check (
      avatar_url is null
      or (length(avatar_url) <= 500 and avatar_url ~ '^(https://|/)')
    );

grant update (avatar_url) on public.usuario to authenticated;

comment on column public.usuario.avatar_url is
  'URL pública da foto de perfil (Supabase Storage bucket avatares).';

-- ---- 2. helper seguro para checar gestor da pasta no Storage ----------------

-- Valida o formato UUID antes do cast para evitar erro 22P02 quando o Postgres
-- avalia policies de `storage.objects` em linhas de outros buckets.
create or replace function public.eh_gestor_da_pasta(p_caminho text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pasta text := split_part(coalesce(p_caminho, ''), '/', 1);
begin
  if v_pasta !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.eh_gestor(v_pasta::uuid);
end;
$$;

revoke execute on function public.eh_gestor_da_pasta(text) from public, anon;
grant  execute on function public.eh_gestor_da_pasta(text) to authenticated;

comment on function public.eh_gestor_da_pasta(text) is
  'true quando o primeiro segmento do caminho no Storage é um id_ilpi válido gerido por auth.uid().';

-- ---- 3. buckets públicos no Supabase Storage --------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-casas',
  'fotos-casas',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares',
  'avatares',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---- 4. policies em storage.objects -----------------------------------------
-- Nota: `storage.objects` já nasce com RLS ativada no Supabase; não rodamos
-- ALTER TABLE aqui para evitar erro de ownership no SQL Editor.
-- URLs públicas (/object/public/<bucket>/<path>) continuam acessíveis pelo
-- bucket público; as policies abaixo protegem listagem, upload, troca e exclusão.

-- Bucket `fotos-casas`: caminho obrigatório `<id_ilpi>/<arquivo>`.
drop policy if exists fotos_casas_leitura on storage.objects;
create policy fotos_casas_leitura on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos-casas'
    and public.eh_gestor_da_pasta(name)
  );

drop policy if exists fotos_casas_cria on storage.objects;
create policy fotos_casas_cria on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos-casas'
    and array_length(string_to_array(name, '/'), 1) = 2
    and split_part(name, '/', 2) <> ''
    and public.eh_gestor_da_pasta(name)
  );

drop policy if exists fotos_casas_edita on storage.objects;
create policy fotos_casas_edita on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fotos-casas'
    and public.eh_gestor_da_pasta(name)
  )
  with check (
    bucket_id = 'fotos-casas'
    and array_length(string_to_array(name, '/'), 1) = 2
    and split_part(name, '/', 2) <> ''
    and public.eh_gestor_da_pasta(name)
  );

drop policy if exists fotos_casas_apaga on storage.objects;
create policy fotos_casas_apaga on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos-casas'
    and public.eh_gestor_da_pasta(name)
  );

-- Bucket `avatares`: caminho obrigatório `<id_usuario>/<arquivo>`.
drop policy if exists avatares_leitura on storage.objects;
create policy avatares_leitura on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatares'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists avatares_cria on storage.objects;
create policy avatares_cria on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and array_length(string_to_array(name, '/'), 1) = 2
    and split_part(name, '/', 2) <> ''
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists avatares_edita on storage.objects;
create policy avatares_edita on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatares'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatares'
    and array_length(string_to_array(name, '/'), 1) = 2
    and split_part(name, '/', 2) <> ''
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists avatares_apaga on storage.objects;
create policy avatares_apaga on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares'
    and split_part(name, '/', 1) = auth.uid()::text
  );
