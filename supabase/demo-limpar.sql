-- Limpa o que supabase/demo.mjs criou (rode no SQL Editor do Supabase).
-- Ordem: primeiro o que tem FK "restrict" (registro_assistencial, residente,
-- log_acao), depois o resto. Não toca nas 8 casas do seed.sql.

-- ---- ajustes: se você trocou os slugs/e-mails no demo.mjs, troque aqui ------
-- slugs das casas de demonstração
--   'residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras'
--   (mais 'casa-de-teste', que o teste E2E do painel cria e depois não apaga)
-- e-mails das contas de demonstração: terminam em @ginkle.me

-- ---- 1. trilha de auditoria (log_acao bloqueia a exclusão do usuário) -------
delete from public.log_acao
where id_usuario in (
  select id_usuario from public.usuario where email like '%@ginkle.me'
);

-- ---- 1b. assinaturas (FK restrict em usuario e plano; cascateia faturamento)
delete from public.assinatura
where id_usuario in (
  select id_usuario from public.usuario where email like '%@ginkle.me'
)
or id_plano in (
  select p.id_plano
  from public.plano p
  join public.ilpi i on i.id_ilpi = p.id_ilpi
  where i.slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras', 'casa-de-teste')
);

-- ---- 2. registros assistenciais das casas de demonstração -------------------
delete from public.registro_assistencial
where id_residente in (
  select r.id_residente
  from public.residente r
  join public.ilpi i on i.id_ilpi = r.id_ilpi
  where i.slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras', 'casa-de-teste')
);

-- ---- 3. vínculos de família ------------------------------------------------
delete from public.familiar_residente
where id_residente in (
  select r.id_residente
  from public.residente r
  join public.ilpi i on i.id_ilpi = r.id_ilpi
  where i.slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras', 'casa-de-teste')
);

-- ---- 4. solicitações de entrada -------------------------------------------
delete from public.adesao_ilpi
where id_ilpi in (
  select id_ilpi from public.ilpi
  where slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras', 'casa-de-teste')
);

-- ---- 5. avaliações ---------------------------------------------------------
delete from public.avaliacao
where id_ilpi in (
  select id_ilpi from public.ilpi
  where slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras', 'casa-de-teste')
);

-- ---- 6. residentes (FK restrict em ilpi) ----------------------------------
delete from public.residente
where id_ilpi in (
  select id_ilpi from public.ilpi
  where slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras', 'casa-de-teste')
);

-- ---- 7. as casas (cascata: foto_ilpi, plano, vinculo_ilpi) ----------------
delete from public.ilpi
where slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras', 'casa-de-teste');

-- ---- 8. as contas (cascata: usuario) --------------------------------------
delete from auth.users where email like '%@ginkle.me';
