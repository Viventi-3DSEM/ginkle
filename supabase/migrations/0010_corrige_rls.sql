-- 0010 · corrige policies com coluna de fora não qualificada e conserta a
-- linha do tempo do familiar.
--
-- Dois problemas resolvidos aqui:
--
-- 1) Seis policies da 0007 referenciam a coluna da tabela de fora SEM
--    qualificar, dentro de um subselect. O Postgres resolve o nome não
--    qualificado para o escopo MAIS INTERNO, então `r.id_residente =
--    id_residente` vira `r.id_residente = r.id_residente` — sempre verdade — e
--    o filtro por casa some: a equipe de qualquer casa alcança o dado de todas.
--    As colunas voltam a ser qualificadas com o nome da tabela da policy.
--
-- 2) A view registro_timeline era security_invoker; os joins em vinculo_ilpi e
--    usuario passam pela RLS, e essas duas só liberam leitura para a equipe.
--    Resultado: um familiar recebia ZERO linhas. Ela vira definer (mesmo padrão
--    de avaliacao_publica: roda como owner, junta usuario e devolve só colunas
--    seguras) e passa a impor o acesso por conta própria, pelo WHERE. Sem esse
--    WHERE, viraria vazamento entre casas.

-- ---- 1. policies da 0007 com a coluna de fora qualificada ------------------

drop policy if exists familiar_leitura on public.familiar_residente;
create policy familiar_leitura on public.familiar_residente
  for select to authenticated
  using (
    id_usuario = auth.uid()
    or exists (
      select 1 from public.residente r
      where r.id_residente = familiar_residente.id_residente
        and public.eh_equipe(r.id_ilpi)
    )
  );

drop policy if exists familiar_equipe_gerencia on public.familiar_residente;
create policy familiar_equipe_gerencia on public.familiar_residente
  for all to authenticated
  using (
    exists (
      select 1 from public.residente r
      where r.id_residente = familiar_residente.id_residente
        and public.eh_equipe(r.id_ilpi)
    )
  )
  with check (
    exists (
      select 1 from public.residente r
      where r.id_residente = familiar_residente.id_residente
        and public.eh_equipe(r.id_ilpi)
    )
  );

drop policy if exists registro_equipe_escreve on public.registro_assistencial;
create policy registro_equipe_escreve on public.registro_assistencial
  for insert to authenticated
  with check (
    public.eh_meu_vinculo(id_vinculo)
    and exists (
      select 1
      from public.residente r
      join public.vinculo_ilpi v
        on v.id_vinculo = registro_assistencial.id_vinculo
      where r.id_residente = registro_assistencial.id_residente
        and r.id_ilpi = v.id_ilpi
    )
  );

drop policy if exists mensagem_leitura on public.mensagem;
create policy mensagem_leitura on public.mensagem
  for select to authenticated
  using (
    exists (
      select 1 from public.conversa c
      where c.id_conversa = mensagem.id_conversa
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
      where c.id_conversa = mensagem.id_conversa
        and (c.id_usuario = auth.uid() or public.eh_equipe(c.id_ilpi))
    )
  );

drop policy if exists faturamento_leitura on public.faturamento;
create policy faturamento_leitura on public.faturamento
  for select to authenticated
  using (
    exists (
      select 1 from public.assinatura a
      where a.id_assinatura = faturamento.id_assinatura
        and a.id_usuario = auth.uid()
    )
  );

-- ---- 2. linha do tempo do residente, legível pelo familiar -----------------

drop view if exists public.registro_timeline;
create view public.registro_timeline as
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
  u.nome   as autor_nome,
  v.cargo  as autor_cargo
from public.registro_assistencial r
join public.vinculo_ilpi v on v.id_vinculo = r.id_vinculo
join public.usuario u      on u.id_usuario = v.id_usuario
where public.pode_ver_residente(r.id_residente);

revoke all on public.registro_timeline from anon;
grant select on public.registro_timeline to authenticated;

comment on view public.registro_timeline is
  'Linha do tempo do residente. View definer: junta o autor (nome/cargo) sem passar pela RLS de usuario/vinculo_ilpi, e filtra por pode_ver_residente.';
