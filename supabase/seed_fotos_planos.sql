-- seed parte 2 · fotos e planos das casas
-- Guardado por NOT EXISTS para poder rodar de novo sem duplicar.

insert into public.foto_ilpi (id_ilpi, url, legenda, ordem)
select i.id_ilpi, v.url, v.legenda, v.ordem
from public.ilpi i
join (values
  ('vida-plena',        '/images/casa.jpg',               'Fachada e jardim interno',            0),
  ('vida-plena',        '/images/sala-estar.jpg',         'Sala de convivência',                 1),
  ('recanto-feliz',     '/images/varanda-janela.jpg',     'Ambiente iluminado junto à janela',   0),
  ('recanto-feliz',     '/images/almoco-convivencia.jpg', 'Refeitório e refeições acompanhadas', 1),
  ('casa-do-sol',       '/images/leito-enfermagem.jpg',   'Quarto adaptado para alta dependência', 0),
  ('casa-do-sol',       '/images/atividades-mesa.jpg',    'Atividades acompanhadas',             1),
  ('bom-viver',         '/images/refeitorio-mesa.jpg',    'Refeitório',                          0),
  ('bom-viver',         '/images/oficina-trico.jpg',      'Oficina de artesanato',               1),
  ('jardim-das-flores', '/images/jardim-flores.jpg',      'Jardim e flores',                     0),
  ('jardim-das-flores', '/images/xadrez-jardim.jpg',      'Lazer ao ar livre',                   1),
  ('novo-horizonte',    '/images/sala-jogos.jpg',         'Sala de convivência e jogos',         0),
  ('novo-horizonte',    '/images/quarto-terapia-pet.jpg', 'Quarto e terapia assistida',          1),
  ('lar-sao-francisco', '/images/convivencia-grupo.jpg',  'Convivência em grupo',                0),
  ('lar-sao-francisco', '/images/corredor-passeio.jpg',   'Circulação interna',                  1),
  ('morada-do-bem',     '/images/quarto-cuidados.jpg',    'Suíte com acompanhamento',            0),
  ('morada-do-bem',     '/images/salao-atividades.jpg',   'Salão de atividades',                 1)
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