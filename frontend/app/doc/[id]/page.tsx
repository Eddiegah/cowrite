"use client";

import { useEffect, useState, useCallback, use, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  createProvider, fetchDocument, updateDocument,
  getUserIdentity, saveUserIdentity, type DocMetadata, type CoWriteProvider,
  API_URL,
} from "@/lib/yjs-provider";
import PresenceBar from "@/components/PresenceBar";
import UserNameModal from "@/components/UserNameModal";
import ShareModal from "@/components/ShareModal";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { ArrowLeft, Share2, PenLine, ChevronRight, Sparkles, AlignLeft, MessageCircle, Phone } from "lucide-react";
import type { CodeLanguage } from "@/components/CodeEditor";
import type { Editor } from "@tiptap/react";
import type { AIContext } from "@/lib/ai";
import ThemeToggle from "@/components/ThemeToggle";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false, loading: () => <EditorSkeleton accent="#6366f1" /> });
const CodeEditor    = dynamic(() => import("@/components/CodeEditor"),    { ssr: false, loading: () => <EditorSkeleton accent="#10b981" /> });
const AIPanel       = dynamic(() => import("@/components/AIPanel"),       { ssr: false });
const DocSidebar    = dynamic(() => import("@/components/DocSidebar"),    { ssr: false });
const ChatPanel     = dynamic(() => import("@/components/ChatPanel"),     { ssr: false });
const VoiceCall     = dynamic(() => import("@/components/VoiceCall"),     { ssr: false });

function EditorSkeleton({ accent }: { accent: string }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-normal)", borderTopColor: accent }} />
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Loading editor…</span>
      </div>
    </div>
  );
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-normal)", borderTopColor: "#6366f1" }} /></div>}>
      <DocPageInner params={params} />
    </Suspense>
  );
}

function DocPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id }        = use(params);
  const searchParams  = useSearchParams();
  const importContent = searchParams.get("content");
  const isImport      = searchParams.get("import") === "1";

  const [docMeta, setDocMeta]             = useState<DocMetadata | null>(null);
  const [metaLoading, setMetaLoading]     = useState(true);
  const [metaError, setMetaError]         = useState<string | null>(null);
  const [waking, setWaking]               = useState(false);  // server wake-up state
  const [providerState, setProviderState] = useState<CoWriteProvider | null>(null);
  const [hpProvider, setHpProvider]       = useState<HocuspocusProvider | null>(null);
  const [connStatus, setConnStatus]       = useState<"connecting"|"connected"|"disconnected">("connecting");
  const [synced, setSynced]               = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showShare, setShowShare]         = useState(false);
  const [editingTitle, setEditingTitle]   = useState(false);
  const [titleValue, setTitleValue]       = useState("");
  const [showAI, setShowAI]               = useState(false);
  const [showSidebar, setShowSidebar]     = useState(false);
  const [showChat, setShowChat]           = useState(false);
  const [showCall, setShowCall]           = useState(false);
  const [unreadChat, setUnreadChat]       = useState(false);
  const [editorRef, setEditorRef]         = useState<Editor | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  /* ── Wake backend + load doc ── */
  useEffect(() => {
    const identity = getUserIdentity();
    if (identity.name === "Anonymous") setShowNameModal(true);

    const load = async () => {
      // Helper: fetch with timeout (AbortSignal.timeout not supported everywhere)
      const fetchWithTimeout = (url: string, ms: number) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
      };

      // Ping health — if Render is sleeping, wait for it to wake up
      try {
        const h = await fetchWithTimeout(`${API_URL}/health`, 5000);
        if (!h.ok) throw new Error("not ok");
      } catch {
        setWaking(true);
        let awake = false;
        for (let i = 0; i < 12 && !awake; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const h2 = await fetchWithTimeout(`${API_URL}/health`, 5000);
            if (h2.ok) awake = true;
          } catch { /* keep waiting */ }
        }
        setWaking(false);
      }

      // Load document metadata
      try {
        const doc = await fetchDocument(id);
        setDocMeta(doc); setTitleValue(doc.name);
      } catch {
        setMetaError("Could not reach the server. Please refresh.");
      } finally {
        setMetaLoading(false);
      }
    };

    load();
  }, [id]);

  /* ── Yjs provider ── */
  useEffect(() => {
    if (!docMeta) return;
    const state = createProvider(id, status => {
      setConnStatus(status);
      if (status === "connected") setTimeout(() => setSynced(true), 150);
    });
    setProviderState(state);
    setHpProvider(state.provider);
    setConnStatus("connecting"); setSynced(false);
    state.provider.on("synced", () => {
      setSynced(true);
      if (isImport && importContent && docMeta.mode === "code") {
        try {
          const decoded = decodeURIComponent(importContent);
          const yText = state.doc.getText("codemirror");
          if (yText.length === 0) yText.insert(0, decoded);
        } catch { /* ignore */ }
      }
    });
    return () => { state.destroy(); setProviderState(null); setHpProvider(null); };
  }, [id, docMeta, isImport, importContent]);

  useEffect(() => {
    if (editingTitle) setTimeout(() => { titleRef.current?.focus(); titleRef.current?.select(); }, 50);
  }, [editingTitle]);

  const handleTitleSave = async () => {
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === docMeta?.name) { setEditingTitle(false); setTitleValue(docMeta?.name ?? ""); return; }
    try { const u = await updateDocument(id, { name: trimmed }); setDocMeta(u); }
    catch { setTitleValue(docMeta?.name ?? ""); }
    finally { setEditingTitle(false); }
  };

  const handleNameSave = (name: string, color: string) => {
    saveUserIdentity({ name, color });
    setShowNameModal(false);
    hpProvider?.setAwarenessField("user", { name, color });
  };

  const handleEditorReady = useCallback((editor: Editor) => {
    setEditorRef(editor);
    if (isImport && importContent && docMeta?.mode === "richtext") {
      try {
        const decoded = decodeURIComponent(importContent);
        setTimeout(() => editor.chain().focus().setContent(`<pre>${decoded.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre>`).run(), 400);
      } catch { /* ignore */ }
    }
  }, [isImport, importContent, docMeta?.mode]);

  const handleLanguageChange = useCallback(async (lang: string) => {
    try { await updateDocument(id, { language: lang }); setDocMeta(prev => prev ? { ...prev, language: lang } : prev); }
    catch { /* non-fatal */ }
  }, [id]);

  const handleAIInsert = useCallback((text: string) => {
    if (!editorRef) return;
    editorRef.chain().focus().insertContent(text.replace(/```\w*\n?([\s\S]*?)```/g, "$1").trim()).run();
  }, [editorRef]);

  const aiContext: AIContext = {
    mode: docMeta?.mode ?? "richtext",
    language: docMeta?.language,
    documentName: docMeta?.name,
    documentContent: editorRef?.getText().slice(0, 2000),
  };

  const isRT = docMeta?.mode === "richtext";

  // ── Loading states ──
  if (metaLoading || waking) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-normal)", borderTopColor: "#6366f1" }} />
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {waking ? "Waking up server… (this takes ~30s on free tier)" : "Loading document…"}
      </p>
      {waking && <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>One-time delay — subsequent loads are instant</p>}
    </div>
  );

  if (metaError || !docMeta) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="text-center">
        <p className="text-sm mb-4" style={{ color: "#f87171" }}>{metaError ?? "Document not found."}</p>
        <Link href="/" className="text-sm underline" style={{ color: "#818cf8" }}>← Back to documents</Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-base)" }}>
      {showNameModal  && <UserNameModal onSave={handleNameSave} />}
      {showShare      && <ShareModal docName={docMeta.name} docId={id} onClose={() => setShowShare(false)} />}

      {/* ── TOP BAR ── */}
      <header className="flex items-center gap-2 px-4 h-12 border-b shrink-0 z-20"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderColor: "var(--border-subtle)" }}>
        <Link href="/" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Image src="/logo.svg" alt="CoWrite" width={22} height={22} className="flex-shrink-0" />
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />

        {editingTitle ? (
          <input ref={titleRef} value={titleValue} onChange={e => setTitleValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleTitleSave(); if (e.key === "Escape") { setEditingTitle(false); setTitleValue(docMeta.name); }}}
            onBlur={handleTitleSave}
            className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b focus:outline-none py-0.5"
            style={{ color: "var(--text-primary)", borderColor: "rgba(99,102,241,0.6)", maxWidth: "280px" }} />
        ) : (
          <button onClick={() => setEditingTitle(true)} className="flex-1 min-w-0 text-left group flex items-center gap-1.5" style={{ maxWidth: "280px" }}>
            <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{docMeta.name}</span>
            <PenLine className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
          </button>
        )}

        <span className="hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: isRT ? "rgba(99,102,241,0.12)" : "rgba(16,185,129,0.12)", color: isRT ? "#818cf8" : "#34d399" }}>
          {isRT ? "Doc" : docMeta.language?.toUpperCase() || "Code"}
        </span>

        <div className="flex-1" />
        <PresenceBar provider={hpProvider} connectionStatus={connStatus} />

        <ThemeToggle />

        {/* Voice call */}
        <button onClick={() => setShowCall(v => !v)} data-tooltip="Voice call"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: showCall ? "rgba(16,185,129,0.2)" : "transparent", color: showCall ? "#34d399" : "var(--text-tertiary)" }}
          onMouseEnter={e => { if (!showCall) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}}
          onMouseLeave={e => { if (!showCall) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}}>
          <Phone className="w-4 h-4" />
        </button>

        {/* Chat */}
        <button onClick={() => { setShowChat(v => !v); setUnreadChat(false); }} data-tooltip="Team chat"
          className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: showChat ? "rgba(251,191,36,0.2)" : "transparent", color: showChat ? "#fbbf24" : "var(--text-tertiary)" }}
          onMouseEnter={e => { if (!showChat) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}}
          onMouseLeave={e => { if (!showChat) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}}>
          <MessageCircle className="w-4 h-4" />
          {unreadChat && !showChat && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400" />}
        </button>

        {/* Outline (richtext) */}
        {isRT && (
          <button onClick={() => setShowSidebar(v => !v)} data-tooltip="Document outline"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
            style={{ background: showSidebar ? "rgba(99,102,241,0.15)" : "transparent", color: showSidebar ? "#818cf8" : "var(--text-tertiary)" }}
            onMouseEnter={e => { if (!showSidebar) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-secondary)"; }}}
            onMouseLeave={e => { if (!showSidebar) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}}>
            <AlignLeft className="w-4 h-4" />
          </button>
        )}

        {/* AI */}
        <button onClick={() => setShowAI(v => !v)} data-tooltip="AI Assistant"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
          style={{ background: showAI ? "rgba(99,102,241,0.2)" : "var(--bg-elevated)", color: showAI ? "#818cf8" : "var(--text-secondary)", border: `1px solid ${showAI ? "rgba(99,102,241,0.3)" : "var(--border-subtle)"}` }}>
          <Sparkles className="w-3.5 h-3.5" /> AI
        </button>

        <button onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 16px rgba(99,102,241,0.25)" }}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </header>

      {connStatus === "disconnected" && (
        <div className="px-4 py-2 text-xs text-center shrink-0 border-b animate-fadeIn"
          style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
          ⚡ Offline — edits saved locally, will sync when reconnected.
        </div>
      )}

      {/* ── PANELS ── */}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && isRT && (
          <div className="flex-shrink-0 border-r overflow-hidden" style={{ width: 260, borderColor: "var(--border-subtle)" }}>
            <DocSidebar editor={editorRef} docName={docMeta.name} onClose={() => setShowSidebar(false)} />
          </div>
        )}

        <div className="flex-1 overflow-hidden min-w-0">
          {providerState && isRT && (
            <RichTextEditor doc={providerState.doc} provider={hpProvider} synced={synced} docName={docMeta.name} onEditorReady={handleEditorReady} />
          )}
          {providerState && !isRT && (
            <CodeEditor doc={providerState.doc} provider={hpProvider} synced={synced}
              initialLanguage={(docMeta.language as CodeLanguage) || "javascript"}
              onLanguageChange={handleLanguageChange} documentName={docMeta.name} />
          )}
        </div>

        {showCall && (
          <div className="flex-shrink-0 border-l overflow-hidden" style={{ width: 300, borderColor: "var(--border-subtle)" }}>
            <VoiceCall docId={id} provider={hpProvider} onClose={() => setShowCall(false)} />
          </div>
        )}

        {showChat && (
          <div className="flex-shrink-0 border-l overflow-hidden" style={{ width: 300, borderColor: "var(--border-subtle)" }}>
            <ChatPanel doc={providerState?.doc ?? null} provider={hpProvider} onClose={() => setShowChat(false)}
              onNewMessage={() => { if (!showChat) setUnreadChat(true); }} />
          </div>
        )}

        {showAI && (
          <div className="flex-shrink-0 border-l overflow-hidden" style={{ width: 340, borderColor: "var(--border-subtle)" }}>
            <AIPanel context={aiContext} onClose={() => setShowAI(false)} onInsert={isRT ? handleAIInsert : undefined} />
          </div>
        )}
      </div>
    </div>
  );
}
