-- 0007 · policies de residentes, registros, chat e financeiro

-- ---- residente -------------------------------------------------------------
drop policy if exists residente_leitura on public.residente;
create policy residente_leitura on public.residente
  for select to authenticated
  using (public.pode_ver_residente(id_residente));

drop policy if exists residente_equipe_escreve on public.residente;
create policy residente_equipe_escreve on public.residente
  for insert to authenticated
  with check (public.eh_equipe(id_ilpi));

drop policy if exists residente_equipe_edita on public.residente;
create policy residente_equipe_edita on public.residente
  for update to authenticated
  using (public.eh_equipe(id_ilpi))
  with check (public.eh_equipe(id_ilpi));

-- ---- familiar_residente ----------------------------------------------------
drop policy if exists familiar_leitura on public.familiar_residente;
create policy familiar_leitura on public.familiar_residente
  for select to authenticated
  using (
    id_usuario = auth.uid()
    or exists (
      select 1 from public.residente r
      where r.id_residente = id_residente and public.eh_equipe(r.id_ilpi)
    )
  );

drop policy if exists familiar_equipe_gerencia on public.familiar_residente;
create policy familiar_equipe_gerencia on public.familiar_residente
  for all to authenticated
  using (
    exists (
      select 1 from public.residente r
      where r.id_residente = id_residente and public.eh_equipe(r.id_ilpi)
    )
  )
  with check (
    exists (
      select 1 from public.residente r
      where r.id_residente = id_residente and public.eh_equipe(r.id_ilpi)
    )
  );

-- ---- adesao_ilpi -----------------------------------------------------------
drop policy if exists adesao_leitura on public.adesao_ilpi;
create policy adesao_leitura on public.adesao_ilpi
  for select to authenticated
  using (id_usuario = auth.uid() or public.eh_equipe(id_ilpi));

drop policy if exists adesao_solicita on public.adesao_ilpi;
create policy adesao_solicita on public.adesao_ilpi
  for insert to authenticated
  with check (id_usuario = auth.uid() and status = 'PENDENTE');

drop policy if exists adesao_responde on public.adesao_ilpi;
create policy adesao_responde on public.adesao_ilpi
  for update to authenticated
  using (public.eh_equipe(id_ilpi))
  with check (public.eh_equipe(id_ilpi));

drop policy if exists adesao_cancela_propria on public.adesao_ilpi;
create policy adesao_cancela_propria on public.adesao_ilpi
  for update to authenticated
  using (id_usuario = auth.uid() and status = 'PENDENTE')
  with check (id_usuario = auth.uid() and status = 'CANCELADA');

-- ---- registro_assistencial -------------------------------------------------
drop policy if exists registro_leitura on public.registro_assistencial;
create policy registro_leitura on public.registro_assistencial
  for select to authenticated
  using (public.pode_ver_residente(id_residente));

drop policy if exists registro_equipe_escreve on public.registro_assistencial;
create policy registro_equipe_escreve on public.registro_assistencial
  for insert to authenticated
  with check (
    public.eh_meu_vinculo(id_vinculo)
    and exists (
      select 1
      from public.residente r
      join public.vinculo_ilpi v on v.id_vinculo = id_vinculo
      where r.id_residente = id_residente and r.id_ilpi = v.id_ilpi
    )
  );

-- ---- conversa / mensagem ---------------------------------------------------
drop policy if exists conversa_leitura on public.conversa;
create policy conversa_leitura on public.conversa
  for select to authenticated
  using (id_usuario = auth.uid() or public.eh_equipe(id_ilpi));

drop policy if exists conversa_cria on public.conversa;
create policy conversa_cria on public.conversa
  for insert to authenticated
  with check (id_usuario = auth.uid());

drop policy if exists mensagem_leitura on public.mensagem;
create policy mensagem_leitura on public.mensagem
  for select to authenticated
  using (
    exists (
      select 1 from public.conversa c
      where c.id_conversa = id_conversa
        and (c.id_usuario = auth.uid() or public.eh_equipe(c.id_ilpi))
    )
  );

drop policy if exists mensagem_envia on public.mensagem;
create policy mensagem_envia on public.mensagem
  for insert to authenticated
  with check (
    id_usuario = auth.uid()
    and exists (
      select 1 from public.conversa c
      where c.id_conversa = id_conversa
        and (c.id_usuario = auth.uid() or public.eh_equipe(c.id_ilpi))
    )
  );

-- ---- assinatura / faturamento (somente leitura para o cliente) --------------
drop policy if exists assinatura_leitura on public.assinatura;
create policy assinatura_leitura on public.assinatura
  for select to authenticated
  using (id_usuario = auth.uid());

drop policy if exists faturamento_leitura on public.faturamento;
create policy faturamento_leitura on public.faturamento
  for select to authenticated
  using (
    exists (
      select 1 from public.assinatura a
      where a.id_assinatura = id_assinatura and a.id_usuario = auth.uid()
    )
  );

-- ---- log_acao --------------------------------------------------------------
-- Sem grant e sem policy: anon/authenticated não enxergam a trilha. Leitura só
-- pelo servidor (service_role), que é quem registra. Append-only por construção.