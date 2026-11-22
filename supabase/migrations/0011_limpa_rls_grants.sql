-- 0011 · limpeza de RLS e grants depois do linter de segurança do Supabase.
--
-- Cinco assuntos: um bug de verdade que o linter nem acusa (porque ele só olha
-- INSERT/UPDATE/DELETE), os três que a lista de lints aponta e uma decisão sobre
-- quem pode avaliar uma casa.
--
-- 1) O MESMO bug da 0007 estava nas policies de leitura da 0006. Em
--    `exists (select 1 from public.ilpi i where i.id_ilpi = id_ilpi ...)`, o
--    `id_ilpi` da direita é resolvido no escopo MAIS INTERNO (a tabela `i`), então
--    o predicado vira `i.id_ilpi = i.id_ilpi` — sempre verdade — e o filtro por
--    casa some. Efeito medido com anon: com uma única casa publicada, ele lê as
--    fotos, os planos e as avaliações das casas em RASCUNHO. Aqui as colunas
--    voltam a ser qualificadas com o nome da tabela da policy.
--    O linter não pega isto: `rls_policy_always_true` só olha USING/WITH CHECK de
--    INSERT/UPDATE/DELETE.
--
-- 2) As policies de leitura pública eram `to anon, authenticated` chamando
--    `eh_equipe()`. Para revogar EXECUTE do anon (item 3) elas precisam deixar de
--    chamar função: cada uma vira duas, uma `to anon` (só `publicado`) e uma
--    `to authenticated` (`publicado or eh_equipe` — mais `eh_familiar_da_casa`
--    nas de casa e foto, ver item 0). Sem essa separação, revogar EXECUTE do anon
--    QUEBRA o diretório público com "permission denied for function eh_equipe" —
--    testado.
--
-- 3) Lint `rls_policy_always_true` em `ilpi_cria` (INSERT with check true): um
--    authenticated sem vínculo conseguia inserir casa direto pelo REST. Não
--    escalava privilégio (o INSERT em vinculo_ilpi é barrado), mas dá para encher
--    o banco de casas órfãs. A criação passa a ser só pela RPC `criar_ilpi()`,
--    que é SECURITY DEFINER e não depende de grant nem de policy.
--
-- 4) Lint `*_security_definer_function_executable`: `revoke ... from anon` nas
--    0005/0008 não bastava, porque no Postgres toda função nasce com EXECUTE
--    para o pseudo-papel PUBLIC, e anon/authenticated herdam dele. Aqui o EXECUTE
--    é revogado de PUBLIC e anon e devolvido só a `authenticated`, que é quem
--    avalia as policies. `handle_new_user` é função de trigger: não precisa de
--    EXECUTE para ninguém.
--
-- 5) Decisão do Kaique: **avaliar casa exige ter parente lá dentro**. Antes,
--    qualquer conta com acesso ao diretório avaliava qualquer casa publicada (e,
--    pelo bug do item 1, até casa em rascunho). Agora `avaliacao_cria` também
--    exige `eh_familiar_da_casa(id_ilpi)`. Efeito colateral desejado: o gestor
--    não avalia a própria casa. Obs.: "já teve parente" não dá para checar —
--    `familiar_residente` não tem histórico, o vínculo é apagado e some.
--
-- As duas views SECURITY DEFINER (`avaliacao_publica`, `registro_timeline`) seguem
-- como estão, de propósito: são o padrão certo para juntar dados de outra tabela
-- sem RLS e filtrar por conta própria. O linter marca toda definer view como
-- ERROR; está documentado no README.

-- ---- 0. helper: o familiar de um residente da casa --------------------------
--
-- Sem isto, arrumar a policy (item 1) tira do familiar o que ele legitimamente
-- precisa: se a casa está em rascunho (ou o gestor tirou ela do diretório), o
-- familiar do residente que mora lá deixa de ler endereço, telefone e foto.
-- Antes da correção ele via — pelo bug, via junto com o mundo inteiro.
-- security definer pela mesma razão de eh_equipe: precisa ler familiar_residente
-- e residente sem passar pela própria RLS (que se chamaria em recursão).

create or replace function public.eh_familiar_da_casa(p_ilpi uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.familiar_residente fr
    join public.residente r on r.id_residente = fr.id_residente
    where fr.id_usuario = auth.uid()
      and r.id_ilpi = p_ilpi
  )
$$;

-- ---- 1 e 2. leitura pública: sem coluna ambígua e sem função para o anon -----

drop policy if exists ilpi_leitura_publica   on public.ilpi;
drop policy if exists ilpi_leitura_anon      on public.ilpi;
drop policy if exists ilpi_leitura_equipe    on public.ilpi;
create policy ilpi_leitura_anon on public.ilpi
  for select to anon
  using (publicado);
create policy ilpi_leitura_equipe on public.ilpi
  for select to authenticated
  using (publicado or public.eh_equipe(id_ilpi) or public.eh_familiar_da_casa(id_ilpi));

drop policy if exists foto_leitura        on public.foto_ilpi;
drop policy if exists foto_leitura_anon   on public.foto_ilpi;
drop policy if exists foto_leitura_equipe on public.foto_ilpi;
create policy foto_leitura_anon on public.foto_ilpi
  for select to anon
  using (
    exists (
      select 1 from public.ilpi i
      where i.id_ilpi = foto_ilpi.id_ilpi and i.publicado
    )
  );
create policy foto_leitura_equipe on public.foto_ilpi
  for select to authenticated
  using (
    public.eh_equipe(id_ilpi)
    or public.eh_familiar_da_casa(id_ilpi)
    or exists (
      select 1 from public.ilpi i
      where i.id_ilpi = foto_ilpi.id_ilpi and i.publicado
    )
  );

drop policy if exists plano_leitura        on public.plano;
drop policy if exists plano_leitura_anon   on public.plano;
drop policy if exists plano_leitura_equipe on public.plano;
create policy plano_leitura_anon on public.plano
  for select to anon
  using (
    ativo
    and exists (
      select 1 from public.ilpi i
      where i.id_ilpi = plano.id_ilpi and i.publicado
    )
  );
create policy plano_leitura_equipe on public.plano
  for select to authenticated
  using (
    public.eh_equipe(id_ilpi)
    or (
      ativo
      and exists (
        select 1 from public.ilpi i
        where i.id_ilpi = plano.id_ilpi and i.publicado
      )
    )
  );

drop policy if exists avaliacao_leitura      on public.avaliacao;
drop policy if exists avaliacao_leitura_anon on public.avaliacao;
create policy avaliacao_leitura_anon on public.avaliacao
  for select to anon
  using (
    exists (
      select 1 from public.ilpi i
      where i.id_ilpi = avaliacao.id_ilpi and i.publicado
    )
  );
create policy avaliacao_leitura on public.avaliacao
  for select to authenticated
  using (
    id_usuario = auth.uid()
    or exists (
      select 1 from public.ilpi i
      where i.id_ilpi = avaliacao.id_ilpi and i.publicado
    )
  );

drop policy if exists avaliacao_cria on public.avaliacao;
create policy avaliacao_cria on public.avaliacao
  for insert to authenticated
  with check (
    id_usuario = auth.uid()
    and exists (
      select 1 from public.ilpi i
      where i.id_ilpi = avaliacao.id_ilpi and i.publicado
    )
    -- só avalia quem tem parente na casa (ou já teve, mas isso a tabela não
    -- guarda: familiar_residente não tem histórico, o vínculo some ao ser
    -- apagado). Impede avaliar a própria casa sendo gestor/funcionário.
    and public.eh_familiar_da_casa(id_ilpi)
  );

-- ---- 3. criar casa é só pela RPC -------------------------------------------

drop policy if exists ilpi_cria on public.ilpi;
revoke insert on public.ilpi from authenticated;

-- ---- 4. EXECUTE das funções definer ----------------------------------------

revoke execute on function public.cargo_na_ilpi(uuid)      from public, anon;
revoke execute on function public.eh_gestor(uuid)          from public, anon;
revoke execute on function public.eh_equipe(uuid)          from public, anon;
revoke execute on function public.eh_familiar_da_casa(uuid) from public, anon;
revoke execute on function public.eh_familiar_de(uuid)     from public, anon;
revoke execute on function public.pode_ver_residente(uuid) from public, anon;
revoke execute on function public.eh_meu_vinculo(uuid)     from public, anon;
revoke execute on function public.meu_cargo()              from public, anon;
revoke execute on function public.handle_new_user()        from public, anon, authenticated;
revoke execute on function public.criar_ilpi(
  text, text, text, text, text, text, text, text, text, text, char
) from public, anon;

grant execute on function public.cargo_na_ilpi(uuid)      to authenticated;
grant execute on function public.eh_gestor(uuid)          to authenticated;
grant execute on function public.eh_equipe(uuid)          to authenticated;
grant execute on function public.eh_familiar_da_casa(uuid) to authenticated;
grant execute on function public.eh_familiar_de(uuid)     to authenticated;
grant execute on function public.pode_ver_residente(uuid) to authenticated;
grant execute on function public.eh_meu_vinculo(uuid)     to authenticated;
grant execute on function public.meu_cargo()              to authenticated;
grant execute on function public.criar_ilpi(
  text, text, text, text, text, text, text, text, text, text, char
) to authenticated;

comment on policy ilpi_leitura_anon on public.ilpi is
  'Anon só lê casa publicada. Separada da de authenticated para o anon não precisar de EXECUTE em eh_equipe().';

comment on function public.eh_familiar_da_casa(uuid) is
  'true quando o usuário tem familiar_residente em algum residente da casa. Mantém a ficha e a foto acessíveis ao familiar mesmo com a casa em rascunho.';
