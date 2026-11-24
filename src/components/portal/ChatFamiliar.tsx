"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  Building2,
  Loader2,
  MessageSquarePlus,
  Radio,
  RefreshCw,
  Send,
} from "lucide-react";
import { enviarMensagemFamiliar, iniciarConversa } from "@/lib/portal/actions";
import type { ChatDoFamiliar, ConversaFamiliar, MensagemChat } from "@/lib/portal/dados";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { dataHora } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

type Props = {
  dados: ChatDoFamiliar;
  casaInicialId?: string;
};

export default function ChatFamiliar({ dados, casaInicialId }: Props) {
  const router = useRouter();
  const inputId = useId();
  const [mensagensLocais, setMensagensLocais] = useState<MensagemChat[]>([]);
  const [ativaId, setAtivaId] = useState<string>(() => {
    if (casaInicialId) {
      const daCasa = dados.conversas.find((c) => c.casaId === casaInicialId);
      if (daCasa) return daCasa.id;
    }
    return dados.conversas[0]?.id ?? "";
  });
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [anuncio, setAnuncio] = useState("");
  const [realtimeAtivo, setRealtimeAtivo] = useState(false);
  const [enviando, startEnvio] = useTransition();
  const [criando, startCriacao] = useTransition();
  const [atualizando, startAtualizacao] = useTransition();
  const fimMensagensRef = useRef<HTMLDivElement>(null);
  const idsConversasRef = useRef<Set<string>>(new Set());

  const conversas: ConversaFamiliar[] = useMemo(() => {
    const combinadas =
      mensagensLocais.length === 0
        ? dados.conversas
        : dados.conversas.map((c) => {
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
  }, [dados.conversas, mensagensLocais]);

  useEffect(() => {
    idsConversasRef.current = new Set(dados.conversas.map((c) => c.id));
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
        .channel(`chat-familiar-${dados.usuarioId}`)
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

            if (!idsConversasRef.current.has(row.id_conversa)) {
              router.refresh();
              return;
            }

            const ehMinha = row.id_usuario === dados.usuarioId;
            const nova: MensagemChat = {
              id: row.id_mensagem,
              conversaId: row.id_conversa,
              conteudo: row.conteudo,
              dataHora: row.data_hora ?? new Date().toISOString(),
              ehMinha,
            };

            setMensagensLocais((prev) =>
              prev.some((m) => m.id === nova.id) ? prev : [...prev, nova],
            );
            if (!ehMinha) setAnuncio("Nova resposta da instituição recebida.");
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
  }, [dados.usuarioId, router]);

  // Fallback automático: se o WebSocket estiver bloqueado pela rede, atualiza sozinho a cada 8s.
  useEffect(() => {
    if (realtimeAtivo) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 8000);
    return () => window.clearInterval(id);
  }, [realtimeAtivo, router]);

  const conversaAtiva = useMemo(
    () => conversas.find((c) => c.id === ativaId) ?? conversas[0] ?? null,
    [conversas, ativaId],
  );

  useEffect(() => {
    fimMensagensRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversaAtiva?.id, conversaAtiva?.mensagens.length]);

  function abrirNovaConversa(casaId: string) {
    setErro("");
    startCriacao(async () => {
      const res = await iniciarConversa(casaId);
      if (res.erro || !res.conversaId) {
        setErro(res.erro ?? "Não foi possível iniciar a conversa.");
        return;
      }
      setAtivaId(res.conversaId);
      setAnuncio("Conversa iniciada com a instituição.");
      router.refresh();
    });
  }

  function enviar() {
    if (!conversaAtiva) return;
    const limpo = texto.trim();
    if (!limpo) return;
    setErro("");

    startEnvio(async () => {
      const res = await enviarMensagemFamiliar(conversaAtiva.id, limpo);
      if (res.erro || !res.mensagemId) {
        setErro(res.erro ?? "Não foi possível enviar sua mensagem.");
        return;
      }
      const novaMsg: MensagemChat = {
        id: res.mensagemId,
        conversaId: conversaAtiva.id,
        conteudo: limpo,
        dataHora: res.dataHora ?? new Date().toISOString(),
        ehMinha: true,
      };
      setMensagensLocais((prev) => [...prev, novaMsg]);
      setTexto("");
      setAnuncio("Mensagem enviada.");
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

  const semConversasNemCasas = conversas.length === 0 && dados.casasDisponiveis.length === 0;

  if (semConversasNemCasas) {
    return (
      <div className="rounded-sm border border-border bg-card p-8 text-center">
        <h2 className="font-heading text-lg font-semibold">Nenhuma conversa disponível ainda</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Assim que você enviar uma solicitação de entrada ou tiver um residente vinculado a uma
          instituição, poderá conversar diretamente com a equipe por aqui.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/casas"
            className="inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explorar casas
          </Link>
          <Link
            href="/cliente/solicitacoes"
            className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Minhas solicitações
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dados.casasDisponiveis.length > 0 ? (
        <section className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Iniciar conversa com uma instituição
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {dados.casasDisponiveis.map((casa) => (
              <button
                key={casa.id}
                type="button"
                disabled={criando}
                onClick={() => abrirNovaConversa(casa.id)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <MessageSquarePlus className="size-3.5 text-brand-strong" aria-hidden="true" />
                <span>{casa.nome}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {conversas.length > 0 ? (
        <div className="space-y-3 lg:grid lg:grid-cols-[17rem_1fr] lg:gap-4 lg:space-y-0">
          {conversas.length > 1 ? (
            <div className="rounded-sm border border-border bg-card p-3 lg:hidden">
              <label
                htmlFor={`${inputId}-conversa`}
                className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Conversa ({conversas.length})
              </label>
              <select
                id={`${inputId}-conversa`}
                value={conversaAtiva?.id ?? ""}
                onChange={(e) => {
                  setAtivaId(e.target.value);
                  setErro("");
                }}
                className="mt-1 w-full cursor-pointer border-b border-input bg-card py-2 text-base font-medium text-foreground outline-none transition-colors focus:border-brand-strong sm:text-sm"
              >
                {conversas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.casaNome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <aside className="hidden rounded-sm border border-border bg-card p-3 lg:block">
            <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Suas conversas
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
                        <Building2
                          className="size-3.5 shrink-0 text-brand-strong"
                          aria-hidden="true"
                        />
                        <span className="truncate">{c.casaNome}</span>
                      </p>
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
            <section className="flex min-h-[26rem] min-w-0 flex-col rounded-sm border border-border bg-card">
              <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-base font-semibold text-foreground">
                    {conversaAtiva.casaNome}
                  </h2>
                  {conversaAtiva.casaCidade ? (
                    <p className="text-xs text-muted-foreground">
                      {conversaAtiva.casaCidade} · {conversaAtiva.casaUf}
                    </p>
                  ) : null}
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
                    Envie a primeira mensagem para a equipe de {conversaAtiva.casaNome}.
                  </p>
                ) : (
                  conversaAtiva.mensagens.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex flex-col",
                        m.ehMinha ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-sm px-4 py-2.5 text-sm leading-relaxed",
                          m.ehMinha
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.conteudo}</p>
                      </div>
                      <span className="mt-1 text-[0.68rem] text-muted-foreground">
                        {m.ehMinha ? "Você" : "Equipe da casa"} ·{" "}
                        <time dateTime={m.dataHora}>{dataHora(m.dataHora)}</time>
                      </span>
                    </div>
                  ))
                )}
                <div ref={fimMensagensRef} />
              </div>

              <form onSubmit={aoSubmeter} className="border-t border-border p-4">
                <label htmlFor={inputId} className="sr-only">
                  Escreva sua mensagem para {conversaAtiva.casaNome}
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
                    placeholder="Escreva sua mensagem... (Enter envia, Shift+Enter quebra linha)"
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
      ) : null}

      <div aria-live="polite" className="sr-only">
        {anuncio}
      </div>
    </div>
  );
}
