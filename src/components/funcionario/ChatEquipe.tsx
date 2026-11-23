"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  Loader2,
  MessageSquarePlus,
  Phone,
  Radio,
  RefreshCw,
  Send,
  User,
} from "lucide-react";
import { enviarMensagemEquipe, iniciarConversaEquipe } from "@/lib/funcionario/actions";
import type {
  ChatDaEquipe,
  ConversaEquipe,
  MensagemEquipeChat,
} from "@/lib/funcionario/dados";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { dataHora } from "@/lib/painel/formato";
import { formatarTelefone } from "@/lib/validacao/telefone";
import { cn } from "@/lib/utils";

export default function ChatEquipe({ dados }: { dados: ChatDaEquipe }) {
  const router = useRouter();
  const inputId = useId();
  const [mensagensLocais, setMensagensLocais] = useState<MensagemEquipeChat[]>([]);
  const [ativaId, setAtivaId] = useState<string>(dados.conversas[0]?.id ?? "");
  const [filtroCasa, setFiltroCasa] = useState("TODAS");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [anuncio, setAnuncio] = useState("");
  const [realtimeAtivo, setRealtimeAtivo] = useState(false);
  const [enviando, startEnvio] = useTransition();
  const [criando, startCriacao] = useTransition();
  const [atualizando, startAtualizacao] = useTransition();
  const fimMensagensRef = useRef<HTMLDivElement>(null);
  const conversasMapaRef = useRef<Map<string, { familiarId: string; familiarNome: string }>>(
    new Map(),
  );

  const conversas: ConversaEquipe[] = useMemo(() => {
    const base =
      filtroCasa === "TODAS"
        ? dados.conversas
        : dados.conversas.filter((c) => c.casaId === filtroCasa);

    const combinadas =
      mensagensLocais.length === 0
        ? base
        : base.map((c) => {
            const extras = mensagensLocais.filter(
              (m) => m.conversaId === c.id && !c.mensagens.some((orig) => orig.id === m.id),
            );
            return extras.length > 0 ? { ...c, mensagens: [...c.mensagens, ...extras] } : c;
          });

    return [...combinadas].sort((a, b) => {
      const ultA = a.mensagens[a.mensagens.length - 1]?.dataHora ?? a.criadaEm;
      const ultB = b.mensagens[b.mensagens.length - 1]?.dataHora ?? b.criadaEm;
      return ultB.localeCompare(ultA);
    });
  }, [dados.conversas, filtroCasa, mensagensLocais]);

  useEffect(() => {
    conversasMapaRef.current = new Map(
      dados.conversas.map((c) => [
        c.id,
        { familiarId: c.familiarId, familiarNome: c.familiarNome },
      ]),
    );
  }, [dados.conversas]);

  // Assinatura Realtime (Postgres Changes) com JWT da sessão: sem `setAuth`,
  // o @supabase/ssr abre o WebSocket como anon e a RLS silencia os eventos.
  useEffect(() => {
    if (!dados.usuarioId || !supabaseConfigurado()) return;

    let cancelado = false;
    const supabase = createClient();
    let canal: ReturnType<typeof supabase.channel> | null = null;

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (session?.access_token) {
        void supabase.realtime.setAuth(session.access_token);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelado) return;
      if (data.session?.access_token) {
        await supabase.realtime.setAuth(data.session.access_token);
      }
      if (cancelado) return;

      canal = supabase
        .channel(`chat-equipe-${dados.usuarioId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "mensagem" },
          (payload) => {
            const row = payload.new as {
              id_mensagem?: string;
              id_conversa?: string;
              id_usuario?: string;
              conteudo?: string;
              data_hora?: string;
            };
            if (!row.id_mensagem || !row.id_conversa || !row.conteudo) return;

            const meta = conversasMapaRef.current.get(row.id_conversa);
            if (!meta) {
              router.refresh();
              return;
            }

            const ehMinha = row.id_usuario === dados.usuarioId;
            const ehFamiliar = row.id_usuario === meta.familiarId;
            const autorNome = ehMinha
              ? "Você"
              : ehFamiliar
                ? meta.familiarNome
                : (dados.nomesEquipe[row.id_usuario ?? ""] ?? "Equipe");

            const nova: MensagemEquipeChat = {
              id: row.id_mensagem,
              conversaId: row.id_conversa,
              conteudo: row.conteudo,
              dataHora: row.data_hora ?? new Date().toISOString(),
              ehMinha,
              ehFamiliar,
              autorNome,
            };

            setMensagensLocais((prev) =>
              prev.some((m) => m.id === nova.id) ? prev : [...prev, nova],
            );
            if (!ehMinha) setAnuncio(`Nova mensagem de ${autorNome}.`);
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "conversa" },
          () => {
            router.refresh();
          },
        )
        .subscribe((status) => {
          if (!cancelado) setRealtimeAtivo(status === "SUBSCRIBED");
        });
    });

    return () => {
      cancelado = true;
      authSub.unsubscribe();
      if (canal) void supabase.removeChannel(canal);
    };
  }, [dados.usuarioId, dados.nomesEquipe, router]);

  // Fallback automático: se o WebSocket estiver bloqueado pela rede, atualiza sozinho a cada 8s.
  useEffect(() => {
    if (realtimeAtivo) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 8000);
    return () => window.clearInterval(id);
  }, [realtimeAtivo, router]);

  const contatosVisiveis = useMemo(
    () =>
      filtroCasa === "TODAS"
        ? dados.contatosDisponiveis
        : dados.contatosDisponiveis.filter((c) => c.casaId === filtroCasa),
    [dados.contatosDisponiveis, filtroCasa],
  );

  const conversaAtiva = useMemo(
    () => conversas.find((c) => c.id === ativaId) ?? conversas[0] ?? null,
    [conversas, ativaId],
  );

  useEffect(() => {
    fimMensagensRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversaAtiva?.id, conversaAtiva?.mensagens.length]);

  function abrirConversa(casaId: string, usuarioId: string) {
    setErro("");
    startCriacao(async () => {
      const res = await iniciarConversaEquipe(casaId, usuarioId);
      if (res.erro || !res.conversaId) {
        setErro(res.erro ?? "Não foi possível iniciar a conversa.");
        return;
      }
      setAtivaId(res.conversaId);
      setAnuncio("Conversa aberta com o familiar.");
      router.refresh();
    });
  }

  function enviar() {
    if (!conversaAtiva) return;
    const limpo = texto.trim();
    if (!limpo) return;
    setErro("");

    startEnvio(async () => {
      const res = await enviarMensagemEquipe(conversaAtiva.id, limpo);
      if (res.erro || !res.mensagemId) {
        setErro(res.erro ?? "Não foi possível enviar a resposta.");
        return;
      }
      const nova: MensagemEquipeChat = {
        id: res.mensagemId,
        conversaId: conversaAtiva.id,
        conteudo: limpo,
        dataHora: res.dataHora ?? new Date().toISOString(),
        ehMinha: true,
        ehFamiliar: false,
        autorNome: "Você",
      };
      setMensagensLocais((prev) => [...prev, nova]);
      setTexto("");
      setAnuncio("Resposta enviada.");
      router.refresh();
    });
  }

  function aoSubmeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    enviar();
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!enviando && texto.trim()) enviar();
    }
  }

  return (
    <div className="space-y-4">
      {dados.casas.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar conversas por casa">
          <button
            type="button"
            aria-pressed={filtroCasa === "TODAS"}
            onClick={() => setFiltroCasa("TODAS")}
            className={cn(
              "min-h-8 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              filtroCasa === "TODAS"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            Todas as casas
          </button>
          {dados.casas.map((casa) => (
            <button
              key={casa.casaId}
              type="button"
              aria-pressed={filtroCasa === casa.casaId}
              onClick={() => setFiltroCasa(casa.casaId)}
              className={cn(
                "min-h-8 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                filtroCasa === casa.casaId
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              {casa.casaNome}
            </button>
          ))}
        </div>
      ) : null}

      {erro && conversas.length === 0 ? (
        <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {erro}
        </p>
      ) : null}

      {contatosVisiveis.length > 0 ? (
        <section className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Iniciar conversa com familiar
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {contatosVisiveis.map((c) => (
              <button
                key={`${c.casaId}:${c.usuarioId}`}
                type="button"
                disabled={criando}
                onClick={() => abrirConversa(c.casaId, c.usuarioId)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <MessageSquarePlus className="size-3.5 text-brand-strong" aria-hidden="true" />
                <span>{c.nome}</span>
                {dados.casas.length > 1 ? (
                  <span className="text-muted-foreground">· {c.casaNome}</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {conversas.length === 0 ? (
        <section className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-heading text-base font-semibold">Nenhuma conversa aberta ainda</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Quando um familiar enviar uma mensagem pelo portal ou você iniciar uma conversa acima,
            o histórico aparecerá aqui.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <aside className="rounded-sm border border-border bg-card p-3">
            <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Conversas ({conversas.length})
            </h2>
            <ul className="space-y-1">
              {conversas.map((c) => {
                const selecionada = conversaAtiva?.id === c.id;
                const ultima = c.mensagens[c.mensagens.length - 1];
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-current={selecionada ? "true" : undefined}
                      onClick={() => {
                        setAtivaId(c.id);
                        setErro("");
                      }}
                      className={cn(
                        "w-full rounded-sm px-3 py-2.5 text-left transition-colors",
                        selecionada
                          ? "bg-secondary text-foreground"
                          : "hover:bg-secondary/50 text-muted-foreground",
                      )}
                    >
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <User className="size-3.5 shrink-0 text-brand-strong" aria-hidden="true" />
                        <span className="truncate">{c.familiarNome}</span>
                      </p>
                      {dados.casas.length > 1 ? (
                        <p className="truncate text-[0.7rem] text-muted-foreground">{c.casaNome}</p>
                      ) : null}
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {ultima ? ultima.conteudo : "Nenhuma mensagem ainda"}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {conversaAtiva ? (
            <section className="flex min-h-[26rem] flex-col rounded-sm border border-border bg-card">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-base font-semibold text-foreground">
                    {conversaAtiva.familiarNome}
                  </h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{conversaAtiva.casaNome}</span>
                    {conversaAtiva.familiarTelefone ? (
                      <a
                        href={`tel:${conversaAtiva.familiarTelefone}`}
                        className="inline-flex items-center gap-1 font-medium text-brand-strong hover:underline"
                      >
                        <Phone className="size-3" aria-hidden="true" />
                        {formatarTelefone(conversaAtiva.familiarTelefone)}
                      </a>
                    ) : null}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {realtimeAtivo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[0.68rem] font-semibold text-success">
                      <Radio className="size-3" aria-hidden="true" />
                      Ao vivo
                    </span>
                  ) : null}

                  <button
                    type="button"
                    disabled={atualizando}
                    onClick={() =>
                      startAtualizacao(() => {
                        router.refresh();
                      })
                    }
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn("size-3.5", atualizando && "animate-spin")}
                      aria-hidden="true"
                    />
                    Atualizar
                  </button>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-5" style={{ maxHeight: "26rem" }}>
                {conversaAtiva.mensagens.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma mensagem trocada ainda nesta conversa.
                  </p>
                ) : (
                  conversaAtiva.mensagens.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex flex-col",
                        m.ehFamiliar ? "items-start" : "items-end",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-sm px-4 py-2.5 text-sm leading-relaxed",
                          m.ehFamiliar
                            ? "border border-border bg-background text-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.conteudo}</p>
                      </div>
                      <span className="mt-1 text-[0.68rem] text-muted-foreground">
                        {m.autorNome} · <time dateTime={m.dataHora}>{dataHora(m.dataHora)}</time>
                      </span>
                    </div>
                  ))
                )}
                <div ref={fimMensagensRef} />
              </div>

              <form onSubmit={aoSubmeter} className="border-t border-border p-4">
                <label htmlFor={inputId} className="sr-only">
                  Responder para {conversaAtiva.familiarNome}
                </label>
                {erro ? (
                  <p role="alert" className="mb-2 text-xs font-medium text-danger">
                    {erro}
                  </p>
                ) : null}
                <div className="flex items-end gap-2.5">
                  <textarea
                    id={inputId}
                    rows={2}
                    maxLength={2000}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={aoTeclar}
                    placeholder="Escreva uma resposta para a família... (Enter envia)"
                    className="flex-1 resize-none border-b border-input bg-transparent py-2 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand-strong sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={enviando || !texto.trim()}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {enviando ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="size-4" aria-hidden="true" />
                    )}
                    Enviar
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {anuncio}
      </div>
    </div>
  );
}
