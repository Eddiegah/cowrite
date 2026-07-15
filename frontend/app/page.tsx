"use client";

import { Suspense } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStoredUser, signOut, type AuthUser } from "@/lib/auth";
import {
  fetchDocuments, createDocument, updateDocument,
  deleteDocument, fetchDocPreview, type DocMetadata,
} from "@/lib/yjs-provider";
import { getTheme, toggleTheme } from "@/lib/theme";
import {
  Plus, Search, FileText, Code2, LayoutGrid, List as ListIcon,
  ChevronDown, Settings, LogOut, User as UserIcon, Upload,
  Clock, Star, Trash2, MoreVertical, FolderOpen, Sparkles,
  BookOpen, Terminal, FileCode2, AlignLeft, Sun, Moon,
} from "lucide-react";

type SortBy = "updatedAt" | "createdAt" | "name";
type ViewMode = "grid" | "list";
type NavSection = "home" | "recent" | "starred";

const TEMPLATES = [
  { id: "blank-doc", name: "Blank document", icon: FileText, color: "#6366f1", mode: "richtext" as const },
  { id: "blank-code", name: "Code file", icon: FileCode2, color: "#10b981", mode: "code" as const },
  { id: "meeting-notes", name: "Meeting notes", icon: AlignLeft, color: "#f59e0b", mode: "richtext" as const },
  { id: "project-plan", name: "Project plan", icon: BookOpen, color: "#8b5cf6", mode: "richtext" as const },
  { id: "api-spec", name: "API spec", icon: Terminal, color: "#3b82f6", mode: "code" as const },
];

const TEMPLATE_CONTENT: Record<string, string> = {
  "meeting-notes": "# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n1. \n2. \n3. \n\n## Notes\n\n## Action Items\n\n- [ ] \n",
  "project-plan": "# Project Plan\n\n## Overview\n\n## Goals\n\n1. \n2. \n\n## Timeline\n\n| Phase | Start | End | Owner |\n|-------|-------|-----|-------|\n| Planning | | | |\n\n## Risks\n\n",
  "api-spec": "// API Specification\n// Service: \n// Version: 1.0.0\n\n/**\n * GET /api/resource\n * Returns a list of resources\n */\n\n",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg-base)" }} className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-normal)", borderTopColor: "#6366f1" }} />
    </div>}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [documents, setDocuments] = useState<DocMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [navSection, setNavSection] = useState<NavSection>("home");
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<"richtext" | "code">("richtext");
  const [createName, setCreateName] = useState("");
  const [createLang, setCreateLang] = useState("javascript");
  const [creating, setCreating] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark"|"light">("dark");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setCurrentTheme(getTheme());
  }, []);

  const handleThemeToggle = () => {
    const next = toggleTheme();
    setCurrentTheme(next);
  };

  useEffect(() => {
    const u = getStoredUser();
    if (!u && !searchParams.get("guest")) { router.push("/auth/signin"); return; }
    setUser(u);
    loadDocs();
    const saved = localStorage.getItem("cowrite_starred");
    if (saved) setStarredIds(new Set(JSON.parse(saved) as string[]));
  }, [router, searchParams]);

  useEffect(() => {
    if (showCreateModal) setTimeout(() => createInputRef.current?.focus(), 60);
  }, [showCreateModal]);

  const loadDocs = async () => {
    setLoading(true); setError(null);
    try { setDocuments(await fetchDocuments()); }
    catch { setError("Can't reach the backend — make sure it's running on port 1235."); }
    finally { setLoading(false); }
  };

  const toggleStar = useCallback((id: string) => {
    setStarredIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("cowrite_starred", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleCreate = async (templateId?: string) => {
    const name = createName.trim() || TEMPLATES.find(t => t.id === templateId)?.name || "Untitled";
    setCreating(true);
    try {
      const doc = await createDocument(name, createMode, createMode === "code" ? createLang : undefined);
      router.push(`/doc/${doc.id}`);
    } catch { alert("Failed to create document."); setCreating(false); }
  };

  const handleTemplateClick = async (template: typeof TEMPLATES[0]) => {
    setCreating(true);
    try {
      const doc = await createDocument(template.name, template.mode,
        template.mode === "code" ? "javascript" : undefined);
      router.push(`/doc/${doc.id}`);
    } catch { alert("Failed to create."); setCreating(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const isCode = /\.(js|ts|py|css|html|md|txt|jsx|tsx|java|rs|go|cpp|c)$/i.test(file.name);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const doc = await createDocument(baseName, isCode ? "code" : "richtext",
        isCode ? file.name.split(".").pop()?.toLowerCase() : undefined);
      router.push(`/doc/${doc.id}?import=1&content=${encodeURIComponent(await file.text())}`);
    } catch { alert("Failed to import file."); }
    finally { setImportLoading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleRename = async (id: string, name: string) => {
    try { const u = await updateDocument(id, { name }); setDocuments(p => p.map(d => d.id === id ? u : d)); }
    catch { alert("Failed to rename."); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDocument(id); setDocuments(p => p.filter(d => d.id !== id)); }
    catch { alert("Failed to delete."); }
  };

  const handleSignOut = () => { signOut(); router.push("/auth/signin"); };

  const filtered = documents
    .filter(d => {
      if (navSection === "starred") return starredIds.has(d.id);
      if (navSection === "recent") return true;
      return d.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "createdAt") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const timeAgo = (iso: string) => {
    const d = Date.now() - new Date(iso).getTime(), m = Math.floor(d / 60000);
    if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const sortLabels: Record<SortBy, string> = { updatedAt: "Last modified", createdAt: "Date created", name: "Name" };

  const NAV = [
    { id: "home" as NavSection, label: "Home", icon: FolderOpen },
    { id: "recent" as NavSection, label: "Recent", icon: Clock },
    { id: "starred" as NavSection, label: "Starred", icon: Star },
  ];

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r h-full"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <Image src="/logo.svg" alt="CoWrite" width={30} height={30} />
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>CoWrite</span>
        </div>

        {/* New doc button */}
        <div className="px-3 pt-4 pb-2">
          <button onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
            <Plus className="w-4 h-4" /> New document
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 pb-3 flex-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setNavSection(id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
              style={{
                background: navSection === id ? "rgba(99,102,241,0.12)" : "transparent",
                color: navSection === id ? "#818cf8" : "var(--text-secondary)",
                fontWeight: navSection === id ? 600 : 400,
              }}
              onMouseEnter={e => { if (navSection !== id) e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { if (navSection !== id) e.currentTarget.style.background = "transparent"; }}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}

          <div className="h-px my-3" style={{ background: "var(--border-subtle)" }} />

          {/* Import */}
          <button onClick={() => fileInputRef.current?.click()} disabled={importLoading}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Upload className="w-4 h-4 flex-shrink-0" />
            {importLoading ? "Importing…" : "Open file"}
          </button>
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.css,.html,.java,.rs,.go,.cpp,.c"
            onChange={handleImport} />
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t relative" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={() => setUserMenuOpen(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: userMenuOpen ? "var(--bg-elevated)" : "transparent" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
            onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.background = "transparent"; }}>
            {user ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: user.avatarColor }}>{user.avatarInitials}</div>
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--bg-hover)" }}><UserIcon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} /></div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.name || "Guest"}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--text-quaternary)" }}>{user?.email || "No account"}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute bottom-16 left-3 right-3 z-20 rounded-xl border py-1.5 shadow-2xl animate-scaleIn"
                style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-lg)" }}>
                {user && (
                  <Link href="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </Link>
                )}
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left"
                  style={{ color: "#f87171" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 h-14 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
            <input type="text" placeholder="Search documents…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border focus:outline-none transition-all"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.background = "var(--bg-overlay)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border-subtle)"; e.target.style.background = "var(--bg-elevated)"; }} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <button onClick={handleThemeToggle}
              data-tooltip={currentTheme === "dark" ? "Light mode" : "Dark mode"}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; }}>
              {currentTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {/* Sort */}
            <div className="relative">
              <button onClick={() => setSortMenuOpen(v => !v)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                {sortLabels[sortBy]} <ChevronDown className="w-3 h-3" />
              </button>
              {sortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 w-44 rounded-xl py-1.5 border shadow-xl animate-scaleIn"
                    style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)" }}>
                    {(Object.entries(sortLabels) as [SortBy, string][]).map(([k, v]) => (
                      <button key={k} onClick={() => { setSortBy(k); setSortMenuOpen(false); }}
                        className="w-full text-left flex items-center justify-between px-4 py-2 text-xs transition-colors"
                        style={{ color: sortBy === k ? "#818cf8" : "var(--text-secondary)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {v} {sortBy === k && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-subtle)" }}>
              {([["grid", LayoutGrid], ["list", ListIcon]] as const).map(([m, Icon]) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className="w-8 h-8 flex items-center justify-center transition-all"
                  style={{ background: viewMode === m ? "var(--bg-overlay)" : "var(--bg-elevated)", color: viewMode === m ? "var(--text-primary)" : "var(--text-quaternary)" }}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 pb-8">
            {/* Template gallery — only on Home */}
            {navSection === "home" && !searchQuery && (
              <div className="py-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Start a new document</h2>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Templates</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => handleTemplateClick(t)} disabled={creating}
                      className="flex-shrink-0 flex flex-col items-center gap-2 group">
                      <div className="w-28 h-36 rounded-xl border transition-all group-hover:border-opacity-60 flex flex-col items-center justify-center gap-2 overflow-hidden"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", boxShadow: "none" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLElement).style.borderColor = t.color + "60"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-normal)"; }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.color + "18" }}>
                          <t.icon className="w-5 h-5" style={{ color: t.color }} />
                        </div>
                        <div className="w-14 h-1.5 rounded-full" style={{ background: "var(--border-normal)" }} />
                        <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--border-subtle)" }} />
                        <div className="w-12 h-1.5 rounded-full" style={{ background: "var(--border-subtle)" }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Documents section */}
            <div className="pt-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {navSection === "starred" ? "Starred" : navSection === "recent" ? "Recent" : "All documents"}
                  {!loading && <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-quaternary)" }}>({filtered.length})</span>}
                </h2>
              </div>

              {error && (
                <div className="p-4 rounded-xl mb-5 text-sm border animate-fadeIn"
                  style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                  {error}
                </div>
              )}

              {loading && (
                <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" : "space-y-2"}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: viewMode === "grid" ? 140 : 50 }} />
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-16 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--bg-elevated)" }}>
                    {navSection === "starred" ? <Star className="w-7 h-7" style={{ color: "var(--text-quaternary)" }} />
                      : <FileText className="w-7 h-7" style={{ color: "var(--text-quaternary)" }} />}
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    {navSection === "starred" ? "No starred documents" : searchQuery ? `No results for "${searchQuery}"` : "No documents yet"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>
                    {navSection === "starred" ? "Star documents to find them quickly" : "Create a document or import a file to get started"}
                  </p>
                </div>
              )}

              {/* Grid view */}
              {!loading && filtered.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-fadeIn">
                  {filtered.map(doc => (
                    <DocGridCard key={doc.id} doc={doc} timeAgo={timeAgo}
                      starred={starredIds.has(doc.id)} onStar={() => toggleStar(doc.id)}
                      onRename={handleRename} onDelete={handleDelete} />
                  ))}
                </div>
              )}

              {/* List view */}
              {!loading && filtered.length > 0 && viewMode === "list" && (
                <div className="animate-fadeIn space-y-1">
                  {filtered.map(doc => (
                    <DocListRow key={doc.id} doc={doc} timeAgo={timeAgo}
                      starred={starredIds.has(doc.id)} onStar={() => toggleStar(doc.id)}
                      onRename={handleRename} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── CREATE MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl animate-slideUp overflow-hidden"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>New document</h3>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Choose a type and enter a name</p>
              </div>
            </div>
            <div className="px-6 pb-2">
              <div className="flex gap-2 p-1 rounded-xl mb-4" style={{ background: "var(--bg-base)" }}>
                {([["richtext", FileText, "Document", "Bold, tables, lists", "#818cf8"],
                   ["code", Code2, "Code", "Syntax highlighting", "#34d399"]] as const).map(
                  ([m, Icon, label, desc, col]) => (
                    <button key={m} onClick={() => setCreateMode(m as "richtext"|"code")}
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: createMode === m ? "var(--bg-elevated)" : "transparent",
                        border: `1px solid ${createMode === m ? "var(--border-normal)" : "transparent"}`,
                        boxShadow: createMode === m ? "var(--shadow-sm)" : "none",
                      }}>
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: createMode === m ? col : "var(--text-quaternary)" }} />
                      <div>
                        <div className="text-xs font-semibold" style={{ color: createMode === m ? "var(--text-primary)" : "var(--text-tertiary)" }}>{label}</div>
                        <div className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{desc}</div>
                      </div>
                    </button>
                  )
                )}
              </div>
              <input ref={createInputRef} type="text" value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowCreateModal(false); }}
                placeholder={createMode === "richtext" ? "Untitled Document" : "Untitled Code"}
                className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all mb-3"
                style={{ background: "var(--bg-base)", borderColor: "var(--border-normal)", color: "var(--text-primary)" }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                onBlur={e => e.target.style.borderColor = "var(--border-normal)"} />
              {createMode === "code" && (
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[["javascript","JS"],["typescript","TS"],["python","PY"],["text","TXT"]].map(([l, a]) => (
                    <button key={l} onClick={() => setCreateLang(l)}
                      className="py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: createLang === l ? "rgba(16,185,129,0.12)" : "var(--bg-base)",
                        border: `1px solid ${createLang === l ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                        color: createLang === l ? "#34d399" : "var(--text-tertiary)",
                      }}>{a}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 h-10 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-normal)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button onClick={() => handleCreate()} disabled={creating}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DocGridCard ── */
function DocGridCard({ doc, timeAgo, starred, onStar, onRename, onDelete }: {
  doc: DocMetadata; timeAgo: (s: string) => string;
  starred: boolean; onStar: () => void;
  onRename: (id: string, n: string) => void; onDelete: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(doc.name);
  const isRT = doc.mode === "richtext";
  const color = isRT ? "#6366f1" : "#10b981";

  return (
    <div className="group relative flex flex-col rounded-xl border transition-all duration-150 overflow-hidden cursor-pointer"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-normal)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      {/* Doc preview */}
      <Link href={`/doc/${doc.id}`} className="block p-4 pb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: color + "15" }}>
          {isRT ? <FileText className="w-4 h-4" style={{ color }} /> : <Code2 className="w-4 h-4" style={{ color }} />}
        </div>
        {renaming ? (
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { onRename(doc.id, name); setRenaming(false); } if (e.key === "Escape") { setRenaming(false); setName(doc.name); } }}
            onBlur={() => { onRename(doc.id, name); setRenaming(false); }}
            className="w-full text-xs font-semibold bg-transparent border-b focus:outline-none"
            style={{ color: "var(--text-primary)", borderColor: "var(--accent)" }}
            onClick={e => e.preventDefault()} />
        ) : (
          <p className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
        )}
        <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{timeAgo(doc.updatedAt)}</p>
      </Link>
      {/* Footer */}
      <div className="flex items-center px-3 pb-3 gap-1 mt-auto">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: color + "12", color }}>
          {isRT ? "Doc" : doc.language?.toUpperCase() || "Code"}
        </span>
        <div className="flex-1" />
        <button onClick={e => { e.preventDefault(); onStar(); }}
          className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: starred ? "#f59e0b" : "var(--text-quaternary)" }}>
          <Star className="w-3.5 h-3.5" fill={starred ? "#f59e0b" : "none"} />
        </button>
        <div className="relative">
          <button onClick={e => { e.preventDefault(); setMenu(v => !v); }}
            className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: "var(--text-quaternary)" }}>
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 bottom-7 z-20 w-36 rounded-xl border py-1.5 shadow-xl animate-scaleIn"
                style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)" }}>
                {[
                  { label: "Rename", action: () => { setMenu(false); setRenaming(true); }, danger: false },
                  { label: "Star", action: () => { setMenu(false); onStar(); }, danger: false },
                  { label: "Delete", action: () => { setMenu(false); if (confirm(`Delete "${doc.name}"?`)) onDelete(doc.id); }, danger: true },
                ].map(({ label, action, danger }) => (
                  <button key={label} onClick={action}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs transition-colors"
                    style={{ color: danger ? "#f87171" : "var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {danger && <Trash2 className="w-3 h-3" />}{label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── DocListRow ── */
function DocListRow({ doc, timeAgo, starred, onStar, onRename, onDelete }: {
  doc: DocMetadata; timeAgo: (s: string) => string;
  starred: boolean; onStar: () => void;
  onRename: (id: string, n: string) => void; onDelete: (id: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(doc.name);
  const isRT = doc.mode === "richtext";
  const color = isRT ? "#6366f1" : "#10b981";

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
      style={{ background: "transparent", borderColor: "transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "15" }}>
        {isRT ? <FileText className="w-4 h-4" style={{ color }} /> : <Code2 className="w-4 h-4" style={{ color }} />}
      </div>
      {renaming ? (
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { onRename(doc.id, name); setRenaming(false); } if (e.key === "Escape") { setRenaming(false); setName(doc.name); } }}
          onBlur={() => { onRename(doc.id, name); setRenaming(false); }}
          className="flex-1 text-sm bg-transparent border-b focus:outline-none"
          style={{ color: "var(--text-primary)", borderColor: "var(--accent)" }} />
      ) : (
        <Link href={`/doc/${doc.id}`} className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
        </Link>
      )}
      <span className="text-[11px] hidden sm:block flex-shrink-0" style={{ color: "var(--text-quaternary)" }}>{timeAgo(doc.updatedAt)}</span>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md hidden sm:block flex-shrink-0" style={{ background: color + "12", color }}>
        {isRT ? "Doc" : doc.language?.toUpperCase() || "Code"}
      </span>
      <button onClick={onStar} className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 flex-shrink-0" style={{ color: starred ? "#f59e0b" : "var(--text-quaternary)" }}>
        <Star className="w-3.5 h-3.5" fill={starred ? "#f59e0b" : "none"} />
      </button>
      <div className="relative flex-shrink-0">
        <button onClick={() => setMenu(v => !v)} className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100" style={{ color: "var(--text-quaternary)" }}>
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border py-1.5 shadow-xl animate-scaleIn"
              style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)" }}>
              {[
                { label: "Rename", action: () => { setMenu(false); setRenaming(true); }, danger: false },
                { label: "Star", action: () => { setMenu(false); onStar(); }, danger: false },
                { label: "Delete", action: () => { setMenu(false); if (confirm(`Delete "${doc.name}"?`)) onDelete(doc.id); }, danger: true },
              ].map(({ label, action, danger }) => (
                <button key={label} onClick={action}
                  className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs transition-colors"
                  style={{ color: danger ? "#f87171" : "var(--text-secondary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {danger && <Trash2 className="w-3 h-3" />}{label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
