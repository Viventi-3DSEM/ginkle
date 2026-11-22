"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { Globe, Lock } from "lucide-react";
import Switch from "@/components/painel/Switch";
import { definirVisibilidade } from "@/lib/painel/actions";
import { cn } from "@/lib/utils";

type Props = {
  casaId: string;
  publicado: boolean;
};

export default function VisibilidadeCasa({ casaId, publicado }: Props) {
  const switchId = useId();
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();
  const [visivel, setVisivel] = useOptimistic(publicado);

  function aoAlternar(proximo: boolean) {
    setErro("");
    startTransition(async () => {
      setVisivel(proximo);
      const res = await definirVisibilidade(casaId, proximo);
      if (res.erro) setErro(res.erro);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label
          htmlFor={switchId}
          className="flex cursor-pointer items-start gap-3 select-none"
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm",
              visivel
                ? "bg-secondary text-brand-strong"
                : "bg-muted text-muted-foreground",
            )}
          >
            {visivel ? <Globe className="size-4" /> : <Lock className="size-4" />}
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">
              {visivel ? "Página pública" : "Página privada"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {visivel
                ? "Visível para famílias buscarem no Ginkle."
                : "Oculta nas buscas — visível apenas para sua equipe."}
            </span>
          </span>
        </label>

        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={cn(
              "text-xs font-medium",
              visivel ? "text-brand-strong" : "text-muted-foreground",
            )}
          >
            {visivel ? "Pública" : "Privada"}
          </span>
          <Switch
            id={switchId}
            checked={visivel}
            disabled={pendente}
            onChange={aoAlternar}
          />
        </div>
      </div>

      {erro ? (
        <p role="alert" className="text-xs text-danger">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
