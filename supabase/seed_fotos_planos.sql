-- seed parte 2 · fotos e planos das casas
-- Guardado por NOT EXISTS para poder rodar de novo sem duplicar.

insert into public.foto_ilpi (id_ilpi, url, legenda, ordem)
select i.id_ilpi, v.url, v.legenda, v.ordem
from public.ilpi i
join (values
  ('vida-plena',        '/images/casa.jpg',       'Jardim interno',        0),
  ('vida-plena',        '/images/velhos.jpg',     'Sala de convivência',   1),
  ('recanto-feliz',     '/images/velhos2.jpg',    'Varanda',               0),
  ('recanto-feliz',     '/images/famillia.jpg',   'Refeitório',            1),
  ('casa-do-sol',       '/images/famillia.jpg',   'Quarto adaptado',       0),
  ('casa-do-sol',       '/images/casa.jpg',       'Área externa',          1),
  ('bom-viver',         '/images/velhos.jpg',     'Sala comum',            0),
  ('jardim-das-flores', '/images/casa.jpg',       'Horta',                 0),
  ('jardim-das-flores', '/images/famillia.jpg',   'Almoço no jardim',      1),
  ('novo-horizonte',    '/images/velhos2.jpg',    'Vista do canal',        0),
  ('lar-sao-francisco', '/images/famillia.jpg',   'Sala de estar',         0),
  ('morada-do-bem',     '/images/velhos.jpg',     'Suíte individual',      0),
  ('morada-do-bem',     '/images/casa.jpg',       'Fachada',               1)
) as v(slug, url, legenda, ordem) on v.slug = i.slug
where not exists (
  select 1 from public.foto_ilpi f where f.id_ilpi = i.id_ilpi
);

insert into public.plano (id_ilpi, nome, valor, descricao)
select i.id_ilpi, v.nome, v.valor, v.descricao
from public.ilpi i
join (values
  ('vida-plena',        'Padrão',   3200, 'Quarto compartilhado, enfermagem 24h e refeições.'),
  ('recanto-feliz',     'Padrão',   2900, 'Quarto compartilhado com acompanhamento diário.'),
  ('casa-do-sol',       'Alta dependência', 3800, 'Enfermagem dedicada e fisioterapia diária.'),
  ('bom-viver',         'Econômico', 2800, 'Quarto compartilhado e refeições inclusas.'),
  ('jardim-das-flores', 'Padrão',   3100, 'Quarto compartilhado, horta e atividades.'),
  ('novo-horizonte',    'Individual', 3500, 'Quarto individual com vista para o canal.'),
  ('lar-sao-francisco', 'Econômico', 2700, 'Equipe fixa e refeições inclusas.'),
  ('morada-do-bem',     'Suíte',    4200, 'Suíte individual e enfermagem 24h.')
) as v(slug, nome, valor, descricao) on v.slug = i.slug
where not exists (
  select 1 from public.plano p where p.id_ilpi = i.id_ilpi
);