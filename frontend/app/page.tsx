"use client";

import { Suspense } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStoredUser, signOut, type AuthUser } from "@/lib/auth";
import {
  fetchDocuments, createDocument, updateDocument,
  deleteDocument, type DocMetadata,
} from "@/lib/yjs-provider";
import { getTheme, toggleTheme } from "@/lib/theme";
import {
  Plus, Search, FileText, Code2, LayoutGrid, List as ListIcon,
  ChevronDown, Settings, LogOut, User as UserIcon, Upload,
  Clock, Star, Trash2, MoreHorizontal, FolderOpen,
  BookOpen, Terminal, FileCode2, AlignLeft, Sun, Moon,
  Hash, Inbox, ChevronRight, Folder, PenLine,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

type SortBy = "updatedAt" | "createdAt" | "name";
type ViewMode = "grid" | "list";
type NavSection = "home" | "recent" | "starred" | "trash";

const TEMPLATES = [
  { id: "blank-doc",      name: "Blank document", icon: FileText,  color: "#7c6af7", mode: "richtext" as const, desc: "Start fresh" },
  { id: "blank-code",     name: "Code file",      icon: FileCode2, color: "#23c55e", mode: "code"     as const, desc: "JS/TS/Python" },
  { id: "meeting-notes",  name: "Meeting notes",  icon: AlignLeft, color: "#f59e0b", mode: "richtext" as const, desc: "Agenda + actions" },
  { id: "project-plan",   name: "Project plan",   icon: BookOpen,  color: "#8b5cf6", mode: "richtext" as const, desc: "Goals + timeline" },
  { id: "api-spec",       name: "API spec",       icon: Terminal,  color: "#3b82f6", mode: "code"     as const, desc: "Endpoints + types" },
];

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg-base)", height: "100vh" }} className="flex items-center justify-center"><div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-normal)", borderTopColor: "var(--accent)" }} /></div>}>
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [sidebarExpanded] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"dark"|"light">("dark");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u && !searchParams.get("guest")) { router.push("/auth/signin"); return; }
    setUser(u);
    loadDocs();
    const saved = localStorage.getItem("cowrite_starred");
    if (saved) setStarredIds(new Set(JSON.parse(saved) as string[]));
    if (typeof window !== "undefined") setCurrentTheme(getTheme());
  }, [router, searchParams]);

  useEffect(() => {
    if (showCreateModal) setTimeout(() => createInputRef.current?.focus(), 60);
  }, [showCreateModal]);

  const loadDocs = async () => {
    setLoading(true); setError(null);
    try { setDocuments(await fetchDocuments()); }
    catch { setError("Can't reach the backend."); }
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

  const handleCreate = async () => {
    const name = createName.trim() || "Untitled";
    setCreating(true);
    try {
      const doc = await createDocument(name, createMode, createMode === "code" ? createLang : undefined);
      router.push(`/doc/${doc.id}`);
    } catch { alert("Failed to create document. Is the backend running?"); setCreating(false); }
  };

  const handleTemplateClick = async (t: typeof TEMPLATES[0]) => {
    setCreating(true);
    try { const doc = await createDocument(t.name, t.mode, t.mode === "code" ? "javascript" : undefined); router.push(`/doc/${doc.id}`); }
    catch { alert("Failed."); setCreating(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportLoading(true);
    try {
      const isCode = /\.(js|ts|py|css|html|md|txt|jsx|tsx|java|rs|go|cpp|c)$/i.test(file.name);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const doc = await createDocument(baseName, isCode ? "code" : "richtext", isCode ? file.name.split(".").pop()?.toLowerCase() : undefined);
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

  const handleThemeToggle = () => { const next = toggleTheme(); setCurrentTheme(next); };
  const handleSignOut = () => { signOut(); router.push("/auth/signin"); };

  const filtered = documents
    .filter(d => {
      if (navSection === "starred") return starredIds.has(d.id);
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
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const NAV = [
    { id: "home"    as NavSection, icon: FolderOpen, label: "Home" },
    { id: "recent"  as NavSection, icon: Clock,      label: "Recent" },
    { id: "starred" as NavSection, icon: Star,        label: "Starred" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ════ LEFT SIDEBAR ════ */}
      <aside className="flex flex-shrink-0 h-full" style={{ width: 240, borderRight: "1px solid var(--border-subtle)", background: "var(--bg-sidebar)" }}>
        <div className="flex flex-col w-full h-full overflow-hidden">

          {/* Logo + workspace */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b" style={{ borderColor: "var(--border-subtle)", minHeight: 48 }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c6af7,#9d8fff)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h7M2 11h5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>CoWrite</p>
            </div>
            <button onClick={handleThemeToggle} className="sidebar-icon-btn flex-shrink-0">
              {currentTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* New doc + Search */}
          <div className="px-3 pt-3 pb-2 space-y-1.5">
            <button onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))", boxShadow: "0 2px 12px var(--accent-glow)" }}>
              <Plus className="w-4 h-4" /> New
            </button>
            <button onClick={() => { /* focus search */ }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
              style={{ background: "var(--bg-elevated)", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}>
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-quaternary)" }}>⌘K</kbd>
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-3 pb-2 space-y-0.5">
            {NAV.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setNavSection(id)}
                className={`sidebar-item w-full ${navSection === id ? "active" : ""}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
            <button onClick={() => fileInputRef.current?.click()} className="sidebar-item w-full" disabled={importLoading}>
              <Upload className="w-4 h-4 flex-shrink-0" />
              {importLoading ? "Importing…" : "Open file"}
            </button>
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.css,.html,.java,.rs,.go,.cpp,.c"
              onChange={handleImport} />
          </nav>

          <div className="mx-3 h-px" style={{ background: "var(--border-subtle)" }} />

          {/* Workspace section */}
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest px-2 pb-1.5" style={{ color: "var(--text-quaternary)" }}>Workspaces</p>
            <button className="sidebar-item w-full">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: user?.avatarColor || "var(--accent)" }}>
                {user?.name?.charAt(0).toUpperCase() || "C"}
              </div>
              <span className="truncate">{user?.name ? `${user.name.split(" ")[0]}'s space` : "My Workspace"}</span>
              <ChevronDown className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />
            </button>
          </div>

          {/* Recent docs in sidebar */}
          {documents.length > 0 && (
            <div className="px-3 py-1 flex-1 overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase tracking-widest px-2 pb-1.5" style={{ color: "var(--text-quaternary)" }}>Recent</p>
              {documents.slice(0, 6).map(doc => (
                <Link key={doc.id} href={`/doc/${doc.id}`}
                  className={`sidebar-item flex w-full`}>
                  {doc.mode === "richtext"
                    ? <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                    : <Code2   className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--green)" }} />}
                  <span className="truncate text-xs">{doc.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* User profile at bottom */}
          <div className="px-3 py-3 border-t mt-auto relative" style={{ borderColor: "var(--border-subtle)" }}>
            <button onClick={() => setUserMenuOpen(v => !v)}
              className="sidebar-item w-full"
              style={{ background: userMenuOpen ? "var(--bg-hover)" : "transparent" }}>
              {user ? (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: user.avatarColor }}>{user.avatarInitials}</div>
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg-hover)" }}>
                  <UserIcon className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.name || "Guest"}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-quaternary)" }}>{user?.email || "No account"}</p>
              </div>
              <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute bottom-16 left-3 right-3 z-20 rounded-xl border py-1.5 shadow-2xl animate-scaleIn"
                  style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-lg)" }}>
                  {user && (
                    <Link href="/settings" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </Link>
                  )}
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left"
                    style={{ color: "var(--red)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 h-12 border-b shrink-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
            <input type="text" placeholder="Search documents…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-3 text-xs rounded-lg border focus:outline-none transition-all"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
              onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-subtle)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border-subtle)"; e.target.style.boxShadow = "none"; }} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
              className="h-8 px-2.5 rounded-lg text-xs border focus:outline-none"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
              <option value="updatedAt">Last modified</option>
              <option value="createdAt">Date created</option>
              <option value="name">Name</option>
            </select>
            {/* View */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-subtle)" }}>
              {([["grid", LayoutGrid], ["list", ListIcon]] as const).map(([m, Icon]) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className="w-8 h-8 flex items-center justify-center transition-all"
                  style={{ background: viewMode === m ? "var(--bg-active)" : "var(--bg-elevated)", color: viewMode === m ? "var(--text-primary)" : "var(--text-quaternary)" }}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 pb-8">

            {/* Template gallery */}
            {navSection === "home" && !searchQuery && (
              <div className="pt-6 pb-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Start a new document</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => handleTemplateClick(t)} disabled={creating}
                      className="flex-shrink-0 flex flex-col items-center gap-2 group">
                      <div className="w-24 h-32 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-150"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLElement).style.borderColor = t.color + "60"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-normal)"; }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.color + "20" }}>
                          <t.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: t.color }} />
                        </div>
                        <div className="w-12 h-1 rounded-full" style={{ background: "var(--border-normal)" }} />
                        <div className="w-9 h-1 rounded-full" style={{ background: "var(--border-subtle)" }} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{t.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{t.desc}</p>
                      </div>
                    </button>
                  ))}
                  {/* Plus card */}
                  <button onClick={() => setShowCreateModal(true)} className="flex-shrink-0 flex flex-col items-center gap-2 group">
                    <div className="w-24 h-32 rounded-xl border-2 border-dashed flex items-center justify-center transition-all"
                      style={{ borderColor: "var(--border-normal)" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-normal)")}>
                      <Plus className="w-5 h-5" style={{ color: "var(--text-quaternary)" }} />
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>Custom</p>
                  </button>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="pt-5">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {navSection === "starred" ? "Starred" : "All documents"}
                  {!loading && <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-quaternary)" }}>({filtered.length})</span>}
                </h2>
              </div>

              {error && <div className="p-4 rounded-xl mb-4 text-sm border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>{error}</div>}

              {loading && (
                <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" : "space-y-1"}>
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: viewMode === "grid" ? 120 : 44 }} />)}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-16 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-elevated)" }}>
                    {navSection === "starred" ? <Star className="w-6 h-6" style={{ color: "var(--text-quaternary)" }} /> : <FileText className="w-6 h-6" style={{ color: "var(--text-quaternary)" }} />}
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    {navSection === "starred" ? "No starred documents" : searchQuery ? `No results for "${searchQuery}"` : "No documents yet"}
                  </p>
                  <p className="text-xs mb-5" style={{ color: "var(--text-quaternary)" }}>Create a document or import a file to get started</p>
                  <button onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
                    <Plus className="w-4 h-4" /> New document
                  </button>
                </div>
              )}

              {!loading && filtered.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-fadeIn">
                  {filtered.map(doc => (
                    <DocGridCard key={doc.id} doc={doc} timeAgo={timeAgo}
                      starred={starredIds.has(doc.id)} onStar={() => toggleStar(doc.id)}
                      onRename={handleRename} onDelete={handleDelete} />
                  ))}
                </div>
              )}

              {!loading && filtered.length > 0 && viewMode === "list" && (
                <div className="animate-fadeIn space-y-0.5">
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

        {/* Bottom status bar */}
        {documents.length > 0 && (
          <div className="flex items-center gap-3 px-6 py-2 border-t shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: "var(--green)" }} />
              <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: "var(--green)" }} />
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{documents.length} document{documents.length !== 1 ? "s" : ""} · All changes saved</span>
          </div>
        )}
      </main>

      {/* ════ CREATE MODAL ════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl animate-slideUp overflow-hidden"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-xl)" }}>
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>New document</h3>
              <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>Choose a type and give it a name</p>
              <div className="flex gap-2 p-1 rounded-xl mb-4" style={{ background: "var(--bg-base)" }}>
                {([["richtext","Document","Bold, tables, lists","#7c6af7"], ["code","Code","Syntax highlighting","#23c55e"]] as const).map(([m, label, desc, color]) => (
                  <button key={m} onClick={() => setCreateMode(m as "richtext"|"code")}
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
                    style={{ background: createMode === m ? "var(--bg-elevated)" : "transparent", border: `1px solid ${createMode === m ? "var(--border-normal)" : "transparent"}` }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: createMode === m ? "var(--text-primary)" : "var(--text-tertiary)" }}>{label}</div>
                      <div className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <input ref={createInputRef} type="text" value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowCreateModal(false); }}
                placeholder={createMode === "richtext" ? "Untitled Document" : "Untitled Code"}
                className="w-full h-10 px-3.5 rounded-xl border text-sm focus:outline-none transition-all mb-3"
                style={{ background: "var(--bg-base)", borderColor: "var(--border-normal)", color: "var(--text-primary)" }}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-subtle)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-normal)"; e.target.style.boxShadow = "none"; }} />
              {createMode === "code" && (
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[["javascript","JS"],["typescript","TS"],["python","PY"],["text","TXT"]].map(([l,a]) => (
                    <button key={l} onClick={() => setCreateLang(l)}
                      className="py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: createLang === l ? "var(--green-subtle)" : "var(--bg-base)", border: `1px solid ${createLang === l ? "rgba(35,197,94,0.3)" : "var(--border-subtle)"}`, color: createLang === l ? "var(--green)" : "var(--text-tertiary)" }}>
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6 pt-2">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 h-9 rounded-xl text-sm transition-all"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-normal)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))", boxShadow: "0 4px 16px var(--accent-glow)" }}>
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
  doc: DocMetadata; timeAgo: (s:string)=>string; starred:boolean;
  onStar:()=>void; onRename:(id:string,n:string)=>void; onDelete:(id:string)=>void;
}) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(doc.name);
  const isRT = doc.mode === "richtext";
  const color = isRT ? "var(--accent)" : "var(--green)";

  return (
    <div className="group relative flex flex-col rounded-xl border transition-all duration-150 overflow-hidden"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-normal)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div className="h-0.5 w-full" style={{ background: isRT ? "linear-gradient(90deg,var(--accent),var(--accent-hover))" : "linear-gradient(90deg,var(--green),#4ade80)" }} />
      <Link href={`/doc/${doc.id}`} className="block p-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: isRT ? "var(--accent-subtle)" : "var(--green-subtle)" }}>
          {isRT ? <FileText className="w-4 h-4" style={{ color }} /> : <Code2 className="w-4 h-4" style={{ color }} />}
        </div>
        {renaming ? (
          <input autoFocus value={name} onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"){onRename(doc.id,name);setRenaming(false);}if(e.key==="Escape"){setRenaming(false);setName(doc.name);}}}
            onBlur={()=>{onRename(doc.id,name);setRenaming(false);}}
            className="w-full text-xs font-semibold bg-transparent border-b focus:outline-none"
            style={{color:"var(--text-primary)",borderColor:"var(--accent)"}}
            onClick={e=>e.preventDefault()} />
        ) : (
          <p className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
        )}
        <p className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{timeAgo(doc.updatedAt)}</p>
      </Link>
      <div className="flex items-center px-3 pb-3 gap-1">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: isRT ? "var(--accent-subtle)" : "var(--green-subtle)", color }}>
          {isRT ? "Doc" : doc.language?.toUpperCase() || "Code"}
        </span>
        <div className="flex-1" />
        <button onClick={e=>{e.preventDefault();onStar();}} className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ color: starred ? "var(--amber)" : "var(--text-quaternary)" }}>
          <Star className="w-3.5 h-3.5" fill={starred ? "var(--amber)" : "none"} />
        </button>
        <div className="relative">
          <button onClick={e=>{e.preventDefault();setMenu(v=>!v);}} className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ color: "var(--text-quaternary)" }}>
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={()=>setMenu(false)} />
              <div className="absolute right-0 bottom-7 z-20 w-36 rounded-xl border py-1.5 shadow-xl animate-scaleIn" style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)" }}>
                {[
                  {label:"Rename",action:()=>{setMenu(false);setRenaming(true);}},
                  {label:"Star",action:()=>{setMenu(false);onStar();}},
                  {label:"Delete",action:()=>{setMenu(false);if(confirm(`Delete "${doc.name}"?`))onDelete(doc.id);},danger:true},
                ].map(({label,action,danger})=>(
                  <button key={label} onClick={action} className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs transition-colors"
                    style={{ color: danger ? "var(--red)" : "var(--text-secondary)" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
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
  doc: DocMetadata; timeAgo: (s:string)=>string; starred:boolean;
  onStar:()=>void; onRename:(id:string,n:string)=>void; onDelete:(id:string)=>void;
}) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(doc.name);
  const isRT = doc.mode === "richtext";
  const color = isRT ? "var(--accent)" : "var(--green)";

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all"
      style={{ background: "transparent", borderColor: "transparent" }}
      onMouseEnter={e=>{e.currentTarget.style.background="var(--bg-elevated)";e.currentTarget.style.borderColor="var(--border-subtle)";}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isRT ? "var(--accent-subtle)" : "var(--green-subtle)" }}>
        {isRT ? <FileText className="w-3.5 h-3.5" style={{color}} /> : <Code2 className="w-3.5 h-3.5" style={{color}} />}
      </div>
      {renaming ? (
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"){onRename(doc.id,name);setRenaming(false);}if(e.key==="Escape"){setRenaming(false);setName(doc.name);}}}
          onBlur={()=>{onRename(doc.id,name);setRenaming(false);}}
          className="flex-1 text-sm bg-transparent border-b focus:outline-none"
          style={{color:"var(--text-primary)",borderColor:"var(--accent)"}} />
      ) : (
        <Link href={`/doc/${doc.id}`} className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
        </Link>
      )}
      <span className="text-[11px] hidden sm:block flex-shrink-0" style={{ color: "var(--text-quaternary)" }}>{timeAgo(doc.updatedAt)}</span>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md hidden sm:block flex-shrink-0" style={{ background: isRT ? "var(--accent-subtle)" : "var(--green-subtle)", color }}>
        {isRT ? "Doc" : doc.language?.toUpperCase() || "Code"}
      </span>
      <button onClick={onStar} className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 flex-shrink-0" style={{ color: starred ? "var(--amber)" : "var(--text-quaternary)" }}>
        <Star className="w-3.5 h-3.5" fill={starred ? "var(--amber)" : "none"} />
      </button>
      <div className="relative flex-shrink-0">
        <button onClick={()=>setMenu(v=>!v)} className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100" style={{ color: "var(--text-quaternary)" }}>
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={()=>setMenu(false)} />
            <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border py-1.5 shadow-xl animate-scaleIn" style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)" }}>
              {[
                {label:"Rename",action:()=>{setMenu(false);setRenaming(true);}},
                {label:"Star",action:()=>{setMenu(false);onStar();}},
                {label:"Delete",action:()=>{setMenu(false);if(confirm(`Delete "${doc.name}"?`))onDelete(doc.id);},danger:true},
              ].map(({label,action,danger})=>(
                <button key={label} onClick={action} className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs transition-colors"
                  style={{ color: danger ? "var(--red)" : "var(--text-secondary)" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
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
