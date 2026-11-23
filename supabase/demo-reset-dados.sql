-- Reseta todos os dados operacionais e de testes (CRUDs) mantendo:
--   1) As 8 casas públicas do seed.sql (e suas fotos/planos);
--   2) As contas de demonstração (Maria Souza, Ana Paula, Helena Prado, etc.)
--      em auth.users e public.usuario, para os botões de demo no /login
--      continuarem funcionando com a mesma senha.
--
-- Depois de rodar este SQL no SQL Editor do Supabase:
--   1) Rode `node supabase/demo.mjs` (com DEMO_PW) para repopular tudo;
--   2) Opcional: rode `supabase/demo-datas-historicas.sql` para espalhar os
--      registros assistenciais ao longo dos últimos 7 dias.

begin;

-- 1. Escalas de turnos
delete from public.escala_turno;

-- 2. Chat (mensagens -> conversas)
delete from public.mensagem;
delete from public.conversa;

-- 3. Financeiro (faturamento -> assinatura)
delete from public.faturamento;
delete from public.assinatura;

-- 4. Trilha de auditoria
delete from public.log_acao;

-- 5. Registros assistenciais, vínculos de família, adesões e avaliações
delete from public.registro_assistencial;
delete from public.familiar_residente;
delete from public.adesao_ilpi;
delete from public.avaliacao;

-- 6. Residentes (FK restrict em ilpi)
delete from public.residente;

-- 7. Vínculos de equipe
delete from public.vinculo_ilpi;

-- 8. Casas criadas fora do seed.sql (inclui demo antigas e "Casa de Teste")
--    Cascateia foto_ilpi e plano dessas casas.
delete from public.ilpi
where slug not in (
  'vida-plena',
  'recanto-feliz',
  'casa-do-sol',
  'bom-viver',
  'jardim-das-flores',
  'novo-horizonte',
  'lar-sao-francisco',
  'morada-do-bem'
);

commit;
