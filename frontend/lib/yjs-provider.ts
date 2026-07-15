/**
 * CoWrite — Yjs Provider & API helpers
 *
 * How sync works:
 * 1. HocuspocusProvider opens a WebSocket to the backend identified by document name.
 * 2. Backend sends the full persisted Yjs state down to the client.
 * 3. As the user types, TipTap/CodeMirror produce Yjs binary diffs.
 * 4. Provider sends those diffs to the server → broadcast to all peers.
 * 5. Incoming diffs from peers are CRDT-merged automatically — any order, same result.
 * 6. Awareness protocol shares cursor position / user identity on the same socket.
 */

import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export const WS_URL  = process.env.NEXT_PUBLIC_WS_URL  || "ws://localhost:1234";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1235";

/* ── User identity ── */

export const USER_COLORS = [
  "#f87171","#fb923c","#fbbf24","#34d399",
  "#60a5fa","#818cf8","#f472b6","#2dd4bf","#a78bfa","#4ade80",
];

export interface UserIdentity { name: string; color: string; }

export function getUserIdentity(): UserIdentity {
  if (typeof window === "undefined") return { name: "Anonymous", color: USER_COLORS[0] };
  try {
    const stored = localStorage.getItem("cowrite_user");
    if (stored) return JSON.parse(stored) as UserIdentity;
  } catch {}
  const identity: UserIdentity = {
    name: "Anonymous",
    color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
  };
  localStorage.setItem("cowrite_user", JSON.stringify(identity));
  return identity;
}

export function saveUserIdentity(identity: UserIdentity): void {
  if (typeof window !== "undefined")
    localStorage.setItem("cowrite_user", JSON.stringify(identity));
}

/* ── Provider factory ── */

export interface CoWriteProvider {
  doc: Y.Doc;
  provider: HocuspocusProvider;
  destroy: () => void;
}

export function createProvider(
  documentId: string,
  onStatusChange?: (status: "connecting" | "connected" | "disconnected") => void,
): CoWriteProvider {
  const doc      = new Y.Doc();
  const identity = getUserIdentity();

  const provider = new HocuspocusProvider({
    url: WS_URL,
    name: documentId,
    document: doc,
    onConnect() {
      provider.setAwarenessField("user", { name: identity.name, color: identity.color });
      onStatusChange?.("connected");
    },
    onDisconnect() { onStatusChange?.("disconnected"); },
  });

  provider.setAwarenessField("user", { name: identity.name, color: identity.color });

  return { doc, provider, destroy: () => { provider.destroy(); doc.destroy(); } };
}

/* ── REST API ── */

export interface DocMetadata {
  id: string;
  name: string;
  mode: "richtext" | "code";
  language?: string;
  createdAt: string;
  updatedAt: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const fetchDocuments   = ()                     => apiFetch<DocMetadata[]>("/api/documents");
export const fetchDocument    = (id: string)           => apiFetch<DocMetadata>(`/api/documents/${id}`);
export const createDocument   = (name: string, mode: "richtext" | "code", language?: string) =>
  apiFetch<DocMetadata>("/api/documents", { method: "POST", body: JSON.stringify({ name, mode, language }) });
export const updateDocument   = (id: string, updates: { name?: string; language?: string }) =>
  apiFetch<DocMetadata>(`/api/documents/${id}`, { method: "PUT", body: JSON.stringify(updates) });
export const deleteDocument   = (id: string) =>
  apiFetch<{ success: boolean }>(`/api/documents/${id}`, { method: "DELETE" });
