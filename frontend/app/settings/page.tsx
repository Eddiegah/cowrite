"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStoredUser, updateProfile, signOut, type AuthUser } from "@/lib/auth";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b","#3b82f6","#ef4444","#14b8a6","#f97316","#84cc16"];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getStoredUser();
    if (!u) { router.push("/auth/signin"); return; }
    setUser(u); setName(u.name); setColor(u.avatarColor);
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    const updated = updateProfile({ name: name.trim(), avatarColor: color });
    if (updated) { setUser(updated); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <header className="border-b px-6 h-14 flex items-center gap-4"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <Link href="/" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Image src="/logo.svg" alt="CoWrite" width={24} height={24} />
        <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        {/* Profile card */}
        <div className="p-6 rounded-2xl border mb-6"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--text-primary)" }}>Profile</h2>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: "var(--bg-base)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: color }}>
              {name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{name || "Your Name"}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{user.email}</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Display name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="settings-input" placeholder="Your name" maxLength={32} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Avatar color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="w-9 h-9 rounded-full transition-all"
                    style={{
                      background: c,
                      transform: color === c ? "scale(1.15)" : "scale(1)",
                      boxShadow: color === c ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${c}` : "none",
                    }} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Email</label>
              <input type="email" value={user.email} disabled
                className="settings-input opacity-50 cursor-not-allowed" />
              <p className="text-xs mt-1" style={{ color: "var(--text-quaternary)" }}>Email cannot be changed in this version.</p>
            </div>

            <button type="submit"
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: saved ? "rgba(16,185,129,0.8)" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save changes"}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="p-6 rounded-2xl border"
          style={{ background: "var(--bg-elevated)", borderColor: "rgba(239,68,68,0.2)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#f87171" }}>Account</h2>
          <button onClick={() => { signOut(); router.push("/auth/signin"); }}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-all"
            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
            Sign out of CoWrite
          </button>
        </div>
      </main>
    </div>
  );
}
