"use client";

import { useState } from "react";
import { Link2, Check, X, Users, Eye, Edit3, Globe } from "lucide-react";

interface ShareModalProps {
  docName: string;
  docId: string;
  onClose: () => void;
}

export default function ShareModal({ docName, docId, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/doc/${docId}` : "";

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border shadow-2xl animate-slideUp overflow-hidden"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-xl)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.12)" }}>
              <Users className="w-4 h-4" style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Share document</h3>
              <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--text-tertiary)" }}>{docName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Access level info */}
        <div className="mx-6 mb-4 p-3.5 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <Globe className="w-4 h-4 flex-shrink-0" style={{ color: "#34d399" }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#34d399" }}>Public link — anyone can collaborate</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Anyone with this link can view and edit in real time</p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="mx-6 mb-4 flex gap-2">
          {[
            { icon: Edit3, label: "Can edit", color: "#818cf8", bg: "rgba(99,102,241,0.08)" },
            { icon: Eye, label: "Can view", color: "#34d399", bg: "rgba(16,185,129,0.08)" },
            { icon: Users, label: "Live presence", color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex-1 justify-center"
              style={{ background: bg, color }}>
              <Icon className="w-3 h-3" />{label}
            </div>
          ))}
        </div>

        {/* URL field + copy */}
        <div className="mx-6 mb-6">
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-quaternary)" }}>
            Shareable link
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl border text-xs truncate"
              style={{ background: "var(--bg-base)", borderColor: "var(--border-normal)", color: "var(--text-tertiary)" }}>
              <Link2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />
              <span className="truncate">{url}</span>
            </div>
            <button onClick={copy}
              className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0"
              style={{
                background: copied ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: copied ? "#34d399" : "white",
                border: copied ? "1px solid rgba(16,185,129,0.3)" : "none",
                boxShadow: copied ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
              }}>
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Link2 className="w-3.5 h-3.5" /> Copy link</>}
            </button>
          </div>
        </div>

        {/* Done */}
        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full h-9 rounded-xl text-sm transition-all"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-normal)", color: "var(--text-secondary)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
