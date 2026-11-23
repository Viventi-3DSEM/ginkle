"use client";

import type { TipoRegistro } from "./dados";

/**
 * Fila offline-first em IndexedDB para registros assistenciais.
 * Cada registro nasce com UUID próprio (`crypto.randomUUID()`) e timestamp do
 * dispositivo (`criadoEmDispositivo`), preservando integridade e idempotência
 * quando a conexão voltar.
 */

const DB_NAME = "ginkle-offline-v1";
const DB_VERSION = 1;
const STORE = "registros_pendentes";
export const EVENTO_FILA_OFFLINE = "ginkle:fila-offline-alterada";

export type RegistroOfflinePendente = {
  idRegistro: string;
  usuarioId: string;
  casaId: string;
  casaNome: string;
  residenteId: string;
  residenteNome: string;
  tipo: TipoRegistro;
  titulo: string;
  descricao: string;
  criadoEmDispositivo: string;
  tentativas: number;
  status: "PENDENTE" | "SINCRONIZANDO" | "ERRO";
  ultimoErro?: string;
  permanente?: boolean;
};

function emitirAtualizacao(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_FILA_OFFLINE));
  }
}

export function gerarUuidRegistro(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback RFC 4122 v4 para contextos sem crypto.randomUUID.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function abrirBanco(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "idRegistro" });
          store.createIndex("usuarioId", "usuarioId", { unique: false });
          store.createIndex("criadoEmDispositivo", "criadoEmDispositivo", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function enfileirarRegistroOffline(
  item: Omit<RegistroOfflinePendente, "tentativas" | "status">,
): Promise<RegistroOfflinePendente | null> {
  const db = await abrirBanco();
  const registro: RegistroOfflinePendente = {
    ...item,
    tentativas: 0,
    status: "PENDENTE",
  };
  if (!db) return null;

  const ok = await new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(registro);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
  db.close();

  if (ok) emitirAtualizacao();
  return ok ? registro : null;
}

export async function listarPendentesOffline(
  usuarioId: string,
): Promise<RegistroOfflinePendente[]> {
  const db = await abrirBanco();
  if (!db) return [];

  const itens = await new Promise<RegistroOfflinePendente[]>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const idx = store.index("usuarioId");
      const req = idx.getAll(usuarioId);
      req.onsuccess = () => resolve((req.result as RegistroOfflinePendente[]) ?? []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
  db.close();

  return itens.sort((a, b) => b.criadoEmDispositivo.localeCompare(a.criadoEmDispositivo));
}

export async function atualizarPendenteOffline(
  idRegistro: string,
  patch: Partial<Pick<RegistroOfflinePendente, "status" | "tentativas" | "ultimoErro" | "permanente">>,
): Promise<void> {
  const db = await abrirBanco();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get(idRegistro);
      getReq.onsuccess = () => {
        const atual = getReq.result as RegistroOfflinePendente | undefined;
        if (atual) {
          store.put({ ...atual, ...patch });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
  db.close();
  emitirAtualizacao();
}

export async function removerPendenteOffline(idRegistro: string): Promise<void> {
  const db = await abrirBanco();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(idRegistro);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
  db.close();
  emitirAtualizacao();
}
