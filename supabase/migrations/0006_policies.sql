-- 0006 · policies (a segunda camada, por linha)

grant insert on public.conversa to authenticated;

-- ---- usuario ---------------------------------------------------------------
drop policy if exists usuario_le_proprio on public.usuario;
create policy usuario_le_proprio on public.usuario
  for select to authenticated
  using (id_usuario = auth.uid());

-- a equipe da casa vê o nome de quem é familiar de um residente dela
drop policy if exists usuario_equipe_le_familiares on public.usuario;
create policy usuario_equipe_le_familiares on public.usuario
  for select to authenticated
  using (
    exists (
      select 1
      from public.familiar_residente f
      join public.residente r on r.id_residente = f.id_residente
      where f.id_usuario = usuario.id_usuario
        and public.eh_equipe(r.id_ilpi)
    )
  );

drop policy if exists usuario_edita_proprio on public.usuario;
create policy usuario_edita_proprio on public.usuario
  for update to authenticated
  using (id_usuario = auth.uid())
  with check (id_usuario = auth.uid());

-- ---- ilpi ------------------------------------------------------------------
drop policy if exists ilpi_leitura_publica on public.ilpi;
create policy ilpi_leitura_publica on public.ilpi
  for select to anon, authenticated
  using (publicado or public.eh_equipe(id_ilpi));

drop policy if exists ilpi_cria on public.ilpi;
create policy ilpi_cria on public.ilpi
  for insert to authenticated
  with check (true);  -- o vínculo de gestor é criado pela RPC criar_ilpi()

drop policy if exists ilpi_gestor_edita on public.ilpi;
create policy ilpi_gestor_edita on public.ilpi
  for update to authenticated
  using (public.eh_gestor(id_ilpi))
  with check (public.eh_gestor(id_ilpi));

-- ---- foto_ilpi -------------------------------------------------------------
drop policy if exists foto_leitura on public.foto_ilpi;
create policy foto_leitura on public.foto_ilpi
  for select to anon, authenticated
  using (
    public.eh_equipe(id_ilpi)
    or exists (select 1 from public.ilpi i where i.id_ilpi = id_ilpi and i.publicado)
  );

drop policy if exists foto_gestor_escreve on public.foto_ilpi;
create policy foto_gestor_escreve on public.foto_ilpi
  for all to authenticated
  using (public.eh_gestor(id_ilpi))
  with check (public.eh_gestor(id_ilpi));

-- ---- plano -----------------------------------------------------------------
drop policy if exists plano_leitura on public.plano;
create policy plano_leitura on public.plano
  for select to anon, authenticated
  using (
    public.eh_equipe(id_ilpi)
    or (ativo and exists (select 1 from public.ilpi i where i.id_ilpi = id_ilpi and i.publicado))
  );

drop policy if exists plano_gestor_escreve on public.plano;
create policy plano_gestor_escreve on public.plano
  for all to authenticated
  using (public.eh_gestor(id_ilpi))
  with check (public.eh_gestor(id_ilpi));

-- ---- avaliacao -------------------------------------------------------------
drop policy if exists avaliacao_leitura on public.avaliacao;
create policy avaliacao_leitura on public.avaliacao
  for select to anon, authenticated
  using (
    id_usuario = auth.uid()
    or exists (select 1 from public.ilpi i where i.id_ilpi = id_ilpi and i.publicado)
  );

drop policy if exists avaliacao_cria on public.avaliacao;
create policy avaliacao_cria on public.avaliacao
  for insert to authenticated
  with check (
    id_usuario = auth.uid()
    and exists (select 1 from public.ilpi i where i.id_ilpi = id_ilpi and i.publicado)
  );

drop policy if exists avaliacao_edita_propria on public.avaliacao;
create policy avaliacao_edita_propria on public.avaliacao
  for update to authenticated
  using (id_usuario = auth.uid())
  with check (id_usuario = auth.uid());

drop policy if exists avaliacao_apaga_propria on public.avaliacao;
create policy avaliacao_apaga_propria on public.avaliacao
  for delete to authenticated
  using (id_usuario = auth.uid());

-- ---- vinculo_ilpi ----------------------------------------------------------
drop policy if exists vinculo_leitura on public.vinculo_ilpi;
create policy vinculo_leitura on public.vinculo_ilpi
  for select to authenticated
  using (id_usuario = auth.uid() or public.eh_equipe(id_ilpi));

drop policy if exists vinculo_gestor_gerencia on public.vinculo_ilpi;
create policy vinculo_gestor_gerencia on public.vinculo_ilpi
  for all to authenticated
  using (public.eh_gestor(id_ilpi))
  with check (public.eh_gestor(id_ilpi));