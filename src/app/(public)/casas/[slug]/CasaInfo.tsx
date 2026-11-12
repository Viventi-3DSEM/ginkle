import { Star } from "lucide-react";
import type { IlpiCompleta } from "@/lib/ilpi/tipos";

const brl = (valor: number) => valor.toLocaleString("pt-BR");

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= nota
              ? "size-3.5 fill-brand-strong text-brand-strong"
              : "size-3.5 text-border"
          }
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function CasaInfo({ casa }: { casa: IlpiCompleta }) {
  return (
    <div className="space-y-12">
      <section aria-labelledby="sobre-a-casa">
        <h2 id="sobre-a-casa" className="font-heading text-xl font-semibold">
          Sobre a casa
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
          {casa.descricao ||
            "A instituição ainda não preencheu a descrição do espaço."}
        </p>

        {casa.tags.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {casa.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-1 font-sans text-xs font-medium text-brand-strong"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="planos">
        <h2 id="planos" className="font-heading text-xl font-semibold">
          Planos e mensalidades
        </h2>
        {casa.planos.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-muted-foreground">
            Mensalidade sob consulta. Fale com a casa pelo cadastro.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {casa.planos.map((plano) => (
              <li
                key={`${plano.nome}-${plano.valor}`}
                className="flex flex-wrap items-baseline justify-between gap-2 py-4"
              >
                <div>
                  <p className="font-heading text-base font-semibold">{plano.nome}</p>
                  {plano.descricao ? (
                    <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                      {plano.descricao}
                    </p>
                  ) : null}
                </div>
                <p className="font-heading text-base font-semibold">
                  R$ {brl(plano.valor)}
                  <span className="font-sans text-xs font-normal text-muted-foreground">
                    /mês
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="avaliacoes">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="avaliacoes" className="font-heading text-xl font-semibold">
            Avaliações de famílias
          </h2>
          {casa.totalAvaliacoes > 0 ? <Estrelas nota={casa.nota} /> : null}
        </div>

        {casa.avaliacoes.length === 0 ? (
          <p className="mt-3 border-l-2 border-border pl-4 font-serif text-sm italic text-muted-foreground">
            Esta casa ainda não recebeu avaliações. Só quem tem vínculo aprovado
            pode avaliar.
          </p>
        ) : (
          <ul className="mt-5 space-y-6">
            {casa.avaliacoes.map((avaliacao, indice) => (
              <li key={`${avaliacao.autor}-${indice}`} className="border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Estrelas nota={avaliacao.nota} />
                  <span className="font-sans text-sm font-medium">{avaliacao.autor}</span>
                  {avaliacao.data ? (
                    <time
                      dateTime={avaliacao.data}
                      className="font-sans text-xs text-muted-foreground"
                    >
                      {new Date(avaliacao.data).toLocaleDateString("pt-BR")}
                    </time>
                  ) : null}
                </div>
                {avaliacao.comentario ? (
                  <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                    {avaliacao.comentario}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="endereco">
        <h2 id="endereco" className="font-heading text-xl font-semibold">
          Onde fica
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
          {casa.endereco}
          <br />
          {casa.bairro}, {casa.cidade} · {casa.uf}
        </p>
        <p className="mt-4 font-sans text-sm text-muted-foreground">
          Telefone{" "}
          <span className="font-medium text-foreground">{casa.telefone}</span>
        </p>
      </section>
    </div>
  );
}