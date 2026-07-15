"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { FileText, Code2, MoreHorizontal, Pencil, Trash2, Copy, Check, X, Clock, ExternalLink } from "lucide-react";
import type { DocMetadata } from "@/lib/yjs-provider";

interface DocumentCardProps {
  doc: DocMetadata;
  viewMode: "grid" | "list";
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (doc: DocMetadata) => Promise<void>;
}

export default function DocumentCard({ doc, viewMode, onRename, onDelete, onDuplicate }: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(doc.name);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRichText = doc.mode === "richtext";

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === doc.name) { setRenaming(false); setNewName(doc.name); return; }
    setLoading(true);
    await onRename(doc.id, trimmed);
    setLoading(false); setRenaming(false);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (confirm(`Delete "${doc.name}"?\nThis cannot be undone.`)) onDelete(doc.id);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const menuItems = [
    { icon: Pencil, label: "Rename", action: () => { setMenuOpen(false); setRenaming(true); setTimeout(() => inputRef.current?.focus(), 50); }, color: "var(--text-secondary)" },
    { icon: Copy, label: "Duplicate", action: () => { setMenuOpen(false); onDuplicate(doc); }, color: "var(--text-secondary)" },
    { icon: ExternalLink, label: "Open in new tab", action: () => { setMenuOpen(false); window.open(`/doc/${doc.id}`, "_blank"); }, color: "var(--text-secondary)" },
    { icon: Trash2, label: "Delete", action: handleDelete, color: "#f87171" },
  ];

  if (viewMode === "list") {
    return (
      <div
        className="group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
        style={{
          background: hovered ? "var(--bg-elevated)" : "transparent",
          borderColor: hovered ? "var(--border-normal)" : "transparent",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); if (!menuOpen) {} }}
      >
        {/* Icon */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: isRichText ? "rgba(99,102,241,0.1)" : "rgba(16,185,129,0.1)" }}>
          {isRichText
            ? <FileText className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />
            : <Code2 className="w-3.5 h-3.5" style={{ color: "#34d399" }} />}
        </div>

        {/* Name */}
        {renaming ? (
          <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setRenaming(false); setNewName(doc.name); } }}
            onBlur={handleRename}
            className="flex-1 text-sm bg-transparent border-b focus:outline-none"
            style={{ color: "var(--text-primary)", borderColor: "var(--accent)" }} />
        ) : (
          <Link href={`/doc/${doc.id}`} className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block" style={{ color: "var(--text-primary)" }}>{doc.name}</span>
          </Link>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] hidden sm:block" style={{ color: "var(--text-quaternary)" }}>{timeAgo(doc.updatedAt)}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium hidden sm:block`}
            style={{
              background: isRichText ? "rgba(99,102,241,0.1)" : "rgba(16,185,129,0.1)",
              color: isRichText ? "#818cf8" : "#34d399"
            }}>
            {isRichText ? "Doc" : doc.language || "Code"}
          </span>
          {/* Menu */}
          <div className="relative">
            <button onClick={e => { e.preventDefault(); setMenuOpen(v => !v); }}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              style={{ color: "var(--text-quaternary)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && <ContextMenu items={menuItems} onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="group relative rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer"
      style={{
        background: hovered ? "var(--bg-elevated)" : "var(--bg-surface)",
        borderColor: hovered ? "var(--border-normal)" : "var(--border-subtle)",
        boxShadow: hovered ? "var(--shadow-md)" : "none",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: isRichText ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "linear-gradient(90deg, #10b981, #34d399)", opacity: hovered ? 1 : 0.4, transition: "opacity 0.2s" }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: isRichText ? "rgba(99,102,241,0.1)" : "rgba(16,185,129,0.1)" }}>
            {isRichText
              ? <FileText className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: "#818cf8" }} />
              : <Code2 className="w-[18px] h-[18px]" style={{ color: "#34d399" }} />}
          </div>

          {/* Context menu button */}
          <div className="relative">
            <button
              onClick={e => { e.preventDefault(); setMenuOpen(v => !v); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: menuOpen ? "var(--bg-hover)" : "transparent",
                color: "var(--text-quaternary)",
                opacity: hovered || menuOpen ? 1 : 0,
              }}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && <ContextMenu items={menuItems} onClose={() => setMenuOpen(false)} />}
          </div>
        </div>

        {/* Title */}
        {renaming ? (
          <div className="mb-2">
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setRenaming(false); setNewName(doc.name); } }}
              onBlur={handleRename}
              className="w-full text-sm font-semibold bg-transparent border-b focus:outline-none pb-0.5"
              style={{ color: "var(--text-primary)", borderColor: "var(--accent)" }}
            />
          </div>
        ) : (
          <Link href={`/doc/${doc.id}`} className="block mb-3">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>{doc.name}</h3>
          </Link>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />
          <span className="text-[11px] truncate" style={{ color: "var(--text-quaternary)" }}>{timeAgo(doc.updatedAt)}</span>
          <div className="flex-1" />
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
            style={{
              background: isRichText ? "rgba(99,102,241,0.1)" : "rgba(16,185,129,0.1)",
              color: isRichText ? "#818cf8" : "#34d399"
            }}>
            {isRichText ? "Doc" : doc.language?.toUpperCase() || "Code"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ContextMenu({ items, onClose }: { items: { icon: React.ElementType; label: string; action: () => void; color: string }[]; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-8 z-20 w-44 rounded-xl py-1.5 shadow-2xl border animate-scaleIn"
        style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-lg)" }}>
        {items.map(({ icon: Icon, label, action, color }, i) => (
          <button key={i} onClick={action}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors text-left"
            style={{ color }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
