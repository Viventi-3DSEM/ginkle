"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { registrarCuidado } from "@/lib/funcionario/actions";
import type { TipoRegistro } from "@/lib/funcionario/dados";
import {
  EVENTO_FILA_OFFLINE,
  atualizarPendenteOffline,
  enfileirarRegistroOffline,
  gerarUuidRegistro,
  listarPendentesOffline,
  removerPendenteOffline,
  type RegistroOfflinePendente,
} from "@/lib/funcionario/offline";

export type NovoRegistroInput = {
  casaId: string;
  casaNome: string;
  residenteId: string;
  residenteNome: string;
  tipo: TipoRegistro;
  titulo: string;
  descricao: string;
  criadoEmDispositivo: string;
};

export type ResultadoSalvamento =
  | { modo: "SINCRONIZADO"; idRegistro: string }
  | { modo: "OFFLINE"; idRegistro: string; motivo: string }
  | { modo: "ERRO"; idRegistro?: string; erro: string };

type OfflineContextValue = {
  online: boolean;
  pendentes: RegistroOfflinePendente[];
  sincronizando: boolean;
  ultimoSyncEm: string | null;
  salvarRegistro: (dados: NovoRegistroInput) => Promise<ResultadoSalvamento>;
  sincronizarFila: () => Promise<{ enviados: number; falhas: number }>;
  descartarPendente: (idRegistro: string) => Promise<void>;
  recarregarFila: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

function assinarOnline(cb: () => void): () => void {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function snapshotOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function snapshotOnlineServidor(): boolean {
  return true;
}

export function OfflineProvider({
  usuarioId,
  children,
}: {
  usuarioId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const online = useSyncExternalStore(assinarOnline, snapshotOnline, snapshotOnlineServidor);
  const [pendentes, setPendentes] = useState<RegistroOfflinePendente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimoSyncEm, setUltimoSyncEm] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const lockSyncRef = useRef(false);

  const recarregarFila = useCallback(async () => {
    const lista = await listarPendentesOffline(usuarioId);
    setPendentes(lista);
  }, [usuarioId]);

  const sincronizarFila = useCallback(async (): Promise<{ enviados: number; falhas: number }> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { enviados: 0, falhas: 0 };
    }
    if (lockSyncRef.current) {
      return { enviados: 0, falhas: 0 };
    }

    lockSyncRef.current = true;
    setSincronizando(true);
    let enviados = 0;
    let falhas = 0;

    try {
      const lista = await listarPendentesOffline(usuarioId);
      // Envia do mais antigo para o mais recente preservando a ordem cronológica.
      const ordenados = [...lista]
        .filter((item) => !item.permanente)
        .sort((a, b) => a.criadoEmDispositivo.localeCompare(b.criadoEmDispositivo));

      for (const item of ordenados) {
        if (typeof navigator !== "undefined" && !navigator.onLine) break;

        await atualizarPendenteOffline(item.idRegistro, {
          status: "SINCRONIZANDO",
          ultimoErro: undefined,
        });

        try {
          const res = await registrarCuidado({
            idRegistro: item.idRegistro,
            idResidente: item.residenteId,
            tipo: item.tipo,
            titulo: item.titulo,
            descricao: item.descricao,
            criadoEmDispositivo: item.criadoEmDispositivo,
          });

          if (res.ok) {
            await removerPendenteOffline(item.idRegistro);
            enviados += 1;
          } else {
            falhas += 1;
            await atualizarPendenteOffline(item.idRegistro, {
              status: "ERRO",
              tentativas: item.tentativas + 1,
              ultimoErro: res.erro ?? "Não foi possível sincronizar este registro.",
              permanente: Boolean(res.permanente),
            });
          }
        } catch {
          falhas += 1;
          await atualizarPendenteOffline(item.idRegistro, {
            status: "PENDENTE",
            tentativas: item.tentativas + 1,
            ultimoErro: "Sem resposta do servidor. Tentará novamente ao reconectar.",
          });
          // Erro de rede: interrompe o laço para não acumular tentativas falhas em cascata.
          break;
        }
      }

      await recarregarFila();

      if (enviados > 0) {
        setUltimoSyncEm(new Date().toISOString());
        setAnuncio(
          enviados === 1
            ? "1 registro offline foi sincronizado com o servidor."
            : `${enviados} registros offline foram sincronizados com o servidor.`,
        );
        router.refresh();
      }
    } finally {
      lockSyncRef.current = false;
      setSincronizando(false);
    }

    return { enviados, falhas };
  }, [usuarioId, recarregarFila, router]);

  useEffect(() => {
    if (!online || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.ready
      .then((reg) => {
        reg.active?.postMessage({ type: "PRECACHE_TURNO" });
      })
      .catch(() => {});
  }, [online]);

  useEffect(() => {
    let ativo = true;

    void listarPendentesOffline(usuarioId).then((lista) => {
      if (!ativo) return;
      setPendentes(lista);
      if (lista.length > 0 && typeof navigator !== "undefined" && navigator.onLine) {
        void sincronizarFila();
      }
    });

    const onOnline = () => {
      setAnuncio("Conexão restabelecida. Verificando registros pendentes.");
      void sincronizarFila();
    };
    const onOffline = () => {
      setAnuncio("Você está offline. Novos registros serão salvos no aparelho.");
    };
    const onFila = () => {
      void recarregarFila();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void sincronizarFila();
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(EVENTO_FILA_OFFLINE, onFila);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ativo = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(EVENTO_FILA_OFFLINE, onFila);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [usuarioId, recarregarFila, sincronizarFila]);

  const salvarRegistro = useCallback(
    async (dados: NovoRegistroInput): Promise<ResultadoSalvamento> => {
      const idRegistro = gerarUuidRegistro();
      const estaOnline = typeof navigator === "undefined" ? true : navigator.onLine;

      // Enfileira localmente primeiro para garantir persistência mesmo se a rede cair durante o envio.
      const enfileirado = await enfileirarRegistroOffline({
        idRegistro,
        usuarioId,
        ...dados,
      });

      if (!estaOnline) {
        await recarregarFila();
        if (!enfileirado) {
          return {
            modo: "ERRO",
            erro: "Sem conexão e não foi possível gravar na fila local deste navegador.",
          };
        }
        setAnuncio("Registro salvo offline no aparelho. Será enviado quando a internet voltar.");
        return {
          modo: "OFFLINE",
          idRegistro,
          motivo: "Sem conexão no momento. O registro ficou salvo no aparelho e será sincronizado automaticamente.",
        };
      }

      try {
        const res = await registrarCuidado({
          idRegistro,
          idResidente: dados.residenteId,
          tipo: dados.tipo,
          titulo: dados.titulo,
          descricao: dados.descricao,
          criadoEmDispositivo: dados.criadoEmDispositivo,
        });

        if (res.ok) {
          if (enfileirado) await removerPendenteOffline(idRegistro);
          await recarregarFila();
          setUltimoSyncEm(new Date().toISOString());
          setAnuncio("Registro salvo e sincronizado com o servidor.");
          router.refresh();
          return { modo: "SINCRONIZADO", idRegistro };
        }

        if (res.permanente) {
          if (enfileirado) await removerPendenteOffline(idRegistro);
          await recarregarFila();
          return { modo: "ERRO", idRegistro, erro: res.erro ?? "Não foi possível salvar." };
        }

        // Erro transitório (servidor/sessão): mantém salvo na fila local.
        if (enfileirado) {
          await atualizarPendenteOffline(idRegistro, {
            status: "PENDENTE",
            tentativas: 1,
            ultimoErro: res.erro,
          });
          await recarregarFila();
          return {
            modo: "OFFLINE",
            idRegistro,
            motivo: res.erro ?? "Salvo localmente para sincronizar em seguida.",
          };
        }

        return { modo: "ERRO", erro: res.erro ?? "Não foi possível salvar o registro." };
      } catch {
        // Queda de rede durante o POST: o item já está seguro no IndexedDB.
        if (enfileirado) {
          await atualizarPendenteOffline(idRegistro, {
            status: "PENDENTE",
            tentativas: 1,
            ultimoErro: "Falha de conexão durante o envio. Aguardando rede.",
          });
          await recarregarFila();
          setAnuncio("Conexão instável. Registro guardado no aparelho para sincronizar depois.");
          return {
            modo: "OFFLINE",
            idRegistro,
            motivo:
              "A conexão caiu durante o envio, mas o registro foi guardado no aparelho e será sincronizado automaticamente.",
          };
        }
        return {
          modo: "ERRO",
          erro: "Sem conexão com o servidor e sem armazenamento local disponível.",
        };
      }
    },
    [usuarioId, recarregarFila, router],
  );

  const descartarPendente = useCallback(
    async (idRegistro: string) => {
      await removerPendenteOffline(idRegistro);
      await recarregarFila();
      setAnuncio("Registro pendente removido da fila local.");
    },
    [recarregarFila],
  );

  const valor = useMemo<OfflineContextValue>(
    () => ({
      online,
      pendentes,
      sincronizando,
      ultimoSyncEm,
      salvarRegistro,
      sincronizarFila,
      descartarPendente,
      recarregarFila,
    }),
    [
      online,
      pendentes,
      sincronizando,
      ultimoSyncEm,
      salvarRegistro,
      sincronizarFila,
      descartarPendente,
      recarregarFila,
    ],
  );

  return (
    <OfflineContext.Provider value={valor}>
      {children}
      <div aria-live="polite" className="sr-only">
        {anuncio}
      </div>
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline precisa ser usado dentro de OfflineProvider.");
  }
  return ctx;
}
