"use client";

import { useState } from "react";
import { saveUserIdentity } from "@/lib/yjs-provider";
import { Sparkles, ArrowRight } from "lucide-react";

const COLORS = ["#f87171","#fb923c","#fbbf24","#34d399","#60a5fa","#818cf8","#f472b6","#2dd4bf","#a78bfa","#4ade80"];

interface UserNameModalProps {
  onSave: (name: string, color: string) => void;
}

export default function UserNameModal({ onSave }: UserNameModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [focused, setFocused] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim() || "Anonymous";
    saveUserIdentity({ name: n, color });
    onSave(n, color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden animate-slideUp"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-xl)" }}>

        {/* Top gradient bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #f472b6)" }} />

        <div className="p-7">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-xl font-bold mb-1 tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            Welcome to CoWrite
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Set your display name so collaborators know who you are.
          </p>

          <form onSubmit={submit} className="space-y-5">
            {/* Name input */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Your name
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white transition-all"
                  style={{ background: color }}>
                  {name.trim().charAt(0).toUpperCase() || "?"}
                </div>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="e.g. Alex Chen"
                  maxLength={32}
                  className="w-full h-12 pl-14 pr-4 rounded-xl border text-sm transition-all focus:outline-none"
                  style={{
                    background: "var(--bg-base)",
                    borderColor: focused ? "rgba(99,102,241,0.6)" : "var(--border-normal)",
                    color: "var(--text-primary)",
                    boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Your color
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                    style={{
                      background: c,
                      transform: color === c ? "scale(1.15)" : "scale(1)",
                      boxShadow: color === c ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${c}` : "none",
                    }}>
                    {color === c && <span className="text-white text-xs font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button type="submit"
              className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
              Start writing <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
