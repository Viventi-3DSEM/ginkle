export const MENSAGEM_MODERACAO =
  "Este texto contém termos inadequados e não pôde ser salvo.";

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
};

const EXPRESSOES_BLOQUEADAS = [
  "filho da puta",
  "filha da puta",
  "filhos da puta",
  "filhas da puta",
  "puta que pariu",
  "vai se foder",
  "vai se fuder",
  "vai tomar no cu",
  "tomar no cu",
  "pau no cu",
  "chupa rola",
  "chupa pau",
  "casa do caralho",
  "preto sujo",
];

const PALAVRAS_BLOQUEADAS = [
  "porra",
  "caralho",
  "caralhos",
  "crlho",
  "krl",
  "krlh",
  "crl",
  "crlh",
  "prr",
  "puta",
  "putas",
  "puto",
  "putos",
  "putaria",
  "putinha",
  "putinho",
  "foda",
  "fodas",
  "fodase",
  "foder",
  "fuder",
  "fodido",
  "fodida",
  "fudido",
  "fudida",
  "fodendo",
  "fudendo",
  "fodeu",
  "fudeu",
  "arrombado",
  "arrombada",
  "arrombados",
  "arrombadas",
  "buceta",
  "bucetas",
  "boceta",
  "bocetas",
  "bct",
  "xoxota",
  "xoxotas",
  "xota",
  "piroca",
  "pirocas",
  "pika",
  "cu",
  "cuzao",
  "cuzoes",
  "cuzinho",
  "bosta",
  "bostas",
  "merda",
  "merdas",
  "fdp",
  "pqp",
  "vsf",
  "vtnc",
  "vtmnc",
  "tnc",
  "viado",
  "viados",
  "veado",
  "veados",
  "boiola",
  "bicha",
  "bichas",
  "sapatao",
  "desgracado",
  "desgracada",
  "desgracados",
  "desgracadas",
  "vagabundo",
  "vagabunda",
  "vagabundos",
  "vagabundas",
  "vadia",
  "vadias",
  "piranha",
  "piranhas",
  "corno",
  "corna",
  "cornos",
  "otario",
  "otaria",
  "otarios",
  "babaca",
  "babacas",
  "escroto",
  "escrota",
  "escrotos",
  "imbecil",
  "imbecis",
  "idiota",
  "idiotas",
  "retardado",
  "retardada",
  "retardados",
  "boquete",
  "punheta",
  "siririca",
  "cacete",
  "nazi",
  "nazista",
  "nazistas",
  "hitler",
  "estupro",
  "estuprar",
  "estuprador",
  "estupradora",
  "fuck",
  "fucking",
  "bitch",
  "asshole",
  "shit",
  "dick",
  "cock",
  "pussy",
];

function colapsarRepeticoes(texto: string): string {
  return texto.replace(/([a-z])\1+/g, "$1");
}

const TERMOS_EXATOS_RE = new RegExp(
  `(?<![a-z])(?:${[...EXPRESSOES_BLOQUEADAS, ...PALAVRAS_BLOQUEADAS].join("|")})(?![a-z])`,
);

// Versão com letras duplicadas colapsadas (pega "pooooorra", "puuuuta", "caaaralho").
const TERMOS_COLAPSADOS = Array.from(
  new Set(
    [...EXPRESSOES_BLOQUEADAS, ...PALAVRAS_BLOQUEADAS]
      .filter((t) => t.length >= 3)
      .map(colapsarRepeticoes),
  ),
);

const TERMOS_COLAPSADOS_RE = new RegExp(`(?<![a-z])(?:${TERMOS_COLAPSADOS.join("|")})(?![a-z])`);

function normalizar(bruto: string): string {
  const semAcento = bruto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // Só converte leetspeak dentro de palavras que já contêm letras, preservando
  // números puros como PA 128/82, 500 mg, 36,4 °C e horários.
  const semLeet = semAcento.replace(/[a-z0-9@$!]+/g, (token) => {
    if (!/[a-z]/.test(token)) return token;
    return token.replace(/[013457@$!]/g, (ch) => LEET[ch] ?? ch);
  });

  // Junta letras avulsas separadas por espaço ou pontuação ("p u t a", "f.d.p", "c*a*r*a*l*h*o").
  const semEspacadas = semLeet.replace(
    /(?<![a-z])(?:[a-z][\s.*_-]+){2,}[a-z](?![a-z])/g,
    (trecho) => trecho.replace(/[^a-z]+/g, ""),
  );

  return semEspacadas
    .replace(/[^a-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function contemTermoInadequado(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const limpo = normalizar(valor);
  if (!limpo) return false;
  if (TERMOS_EXATOS_RE.test(limpo)) return true;
  return TERMOS_COLAPSADOS_RE.test(colapsarRepeticoes(limpo));
}

export function algumTermoInadequado(...valores: (string | null | undefined)[]): boolean {
  return valores.some((v) => contemTermoInadequado(v));
}
