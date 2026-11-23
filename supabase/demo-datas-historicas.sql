-- Opcional (apenas ambiente de demonstração / TCC).
-- Rodar no SQL Editor do Supabase DEPOIS de `node supabase/demo.mjs`.
--
-- Como a migration 0014 trava `sincronizado_em_servidor` para chamadas via API
-- (garantindo o antifraude em produção), o `demo.mjs` cria os registros no tempo
-- real atual (11 pontuais + 1 com 25 min de atraso). Este script administrativo
-- (que roda apenas no SQL Editor, sem expor RPC nem backdoor na API) espalha os
-- registros das 3 casas de demonstração ao longo dos últimos 7 dias para exibir
-- múltiplos agrupamentos diários na linha do tempo e na auditoria.

with casas_demo as (
  select id_ilpi
  from public.ilpi
  where slug in ('residencial-aurora', 'casa-serenidade', 'recanto-das-palmeiras')
),
ordenados as (
  select
    r.id_registro,
    row_number() over (
      partition by res.id_ilpi
      order by r.criado_em_dispositivo desc, r.id_registro
    ) - 1 as idx
  from public.registro_assistencial r
  join public.residente res on res.id_residente = r.id_residente
  where res.id_ilpi in (select id_ilpi from casas_demo)
),
calculados as (
  select
    id_registro,
    idx,
    (
      date_trunc('day', now() at time zone 'America/Sao_Paulo')
      - ((idx / 2) * interval '1 day')
      + case when idx % 2 = 0 then interval '8 hours 20 minutes' else interval '15 hours 40 minutes' end
    ) at time zone 'America/Sao_Paulo' as horario_base,
    case when idx = 3 then interval '25 minutes' else ((25 + idx * 7) * interval '1 second') end as atraso
  from ordenados
),
ajustados as (
  select
    id_registro,
    case
      when horario_base > now() - interval '1 hour' then horario_base - interval '1 day'
      else horario_base
    end as criado_em,
    atraso
  from calculados
)
update public.registro_assistencial r
set
  criado_em_dispositivo    = a.criado_em,
  sincronizado_em_servidor = a.criado_em + a.atraso
from ajustados a
where r.id_registro = a.id_registro;
