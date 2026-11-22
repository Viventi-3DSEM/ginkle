-- 0009 · a equipe de uma casa enxerga o nome dos colegas da mesma casa
--
-- Sem isso, o painel do gestor não consegue mostrar quem registrou cada
-- cuidado: registro_timeline junta usuario e, como a policy de usuario só
-- liberava o próprio perfil (e os familiares de um residente da casa), a junção
-- derrubava a linha e a linha do tempo voltava vazia.

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
        and colega.ativo
    )
  );

comment on policy usuario_equipe_le_equipe on public.usuario is
  'Dois nomes de iguais: é a equipe vendo o nome de quem trabalha na mesma casa.';
