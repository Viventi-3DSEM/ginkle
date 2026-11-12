export type IlpiPublica = {
  slug: string;
  nome: string;
  cidade: string;
  bairro: string;
  uf: string;
  endereco: string;
  descricao: string;
  telefone: string;
  email: string;
  site: string | null;
  vagas: number;
  destaque: string | null;
  nota: number;
  totalAvaliacoes: number;
  mensalidade: number | null;
  capaUrl: string;
  tags: string[];
};

export type FotoIlpi = { url: string; legenda: string | null };

export type PlanoIlpi = {
  nome: string;
  valor: number;
  descricao: string | null;
};

export type AvaliacaoPublica = {
  nota: number;
  comentario: string | null;
  autor: string;
  data: string;
};

export type IlpiCompleta = IlpiPublica & {
  fotos: FotoIlpi[];
  planos: PlanoIlpi[];
  avaliacoes: AvaliacaoPublica[];
};