-- seed das 8 casas demonstrativas (mesmas do protótipo)
-- Idempotente: pode rodar mais de uma vez.

insert into public.ilpi
  (slug, cnpj, nome, telefone, email, site, descricao, endereco, cidade, bairro, uf, vagas, destaque)
values
  ('vida-plena', '11.222.333/0001-10', 'ILPI Vida Plena', '(13) 3474-1010', 'contato@vidaplena.com.br',
   null, 'Casa com jardim interno, equipe de enfermagem 24 horas e visitas todos os dias.',
   'Av. Presidente Costa e Silva, 1200', 'Praia Grande', 'Boqueirão', 'SP', 6, 'Mais procurada'),
  ('recanto-feliz', '11.222.333/0001-21', 'Recanto Feliz', '(13) 3222-2020', 'contato@recantofeliz.com.br',
   null, 'Ambiente familiar a duas quadras da praia, com atividades e refeições acompanhadas.',
   'Rua Galeão Coutinho, 85', 'Santos', 'Gonzaga', 'SP', 4, null),
  ('casa-do-sol', '11.222.333/0001-32', 'Casa do Sol', '(13) 3456-3030', 'contato@casadodosol.com.br',
   null, 'Estrutura para alta dependência, com enfermagem dedicada e fisioterapia diária.',
   'Rua Ipiranga, 240', 'São Vicente', 'Itararé', 'SP', 3, 'Melhor avaliada'),
  ('bom-viver', '11.222.333/0001-43', 'Bom Viver', '(13) 3474-4040', 'contato@bomviver.com.br',
   null, 'Rotina tranquila, quartos compartilhados e refeições preparadas na casa.',
   'Rua dos Ipês, 310', 'Praia Grande', 'Tupi', 'SP', 8, null),
  ('jardim-das-flores', '11.222.333/0001-54', 'Jardim das Flores', '(13) 3361-5050', 'contato@jardimdasflores.com.br',
   null, 'Casa adaptada com jardim, horta e atividades ao ar livre durante a semana.',
   'Rua das Acácias, 55', 'Cubatão', 'Centro', 'SP', 5, null),
  ('novo-horizonte', '11.222.333/0001-65', 'Novo Horizonte', '(13) 3355-6060', 'contato@novohorizonte.com.br',
   null, 'Enfermagem e fisioterapia inclusas, com vista para o canal e quartos individuais.',
   'Av. Miguel Estefno, 900', 'Guarujá', 'Enseada', 'SP', 7, null),
  ('lar-sao-francisco', '11.222.333/0001-76', 'Lar São Francisco', '(13) 3501-7070', 'contato@larsaofrancisco.com.br',
   null, 'Opção econômica com equipe fixa, acompanhamento de rotina e refeições inclusas.',
   'Rua São Francisco, 18', 'Mongaguá', 'Agenor de Campos', 'SP', 9, null),
  ('morada-do-bem', '11.222.333/0001-87', 'Morada do Bem', '(13) 3227-8080', 'contato@moradadobem.com.br',
   null, 'Suítes individuais, enfermagem 24 horas e programação de atividades todos os dias.',
   'Rua Tolentino Filgueiras, 430', 'Santos', 'Boqueirão', 'SP', 2, 'Novo')
on conflict (slug) do nothing;

-- tags de vitrine (array do Postgres: filtro e exibição sem tabela extra)
update public.ilpi set tags = v.tags
from (values
  ('vida-plena',        array['Cuidados 24h','Fisioterapia','Visitas diárias']),
  ('recanto-feliz',     array['Cuidados 24h','Jardim','Atividades']),
  ('casa-do-sol',       array['Alta dependência','Enfermagem','Fisioterapia']),
  ('bom-viver',         array['Cuidados 24h','Refeições inclusas']),
  ('jardim-das-flores', array['Jardim','Atividades','Visitas diárias']),
  ('novo-horizonte',    array['Enfermagem','Fisioterapia']),
  ('lar-sao-francisco', array['Cuidados 24h','Refeições inclusas']),
  ('morada-do-bem',     array['Alta dependência','Enfermagem','Visitas diárias'])
) as v(slug, tags)
where v.slug = ilpi.slug and ilpi.tags = '{}';