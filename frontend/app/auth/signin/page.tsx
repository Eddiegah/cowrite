"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "@/lib/auth";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = signIn(email, password);
    setLoading(false);
    if ("error" in result) { setError(result.error); return; }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d0d10 0%, #13111f 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", transform: "translate(-30%, -30%)" }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", transform: "translate(20%, 20%)" }} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <Image src="/logo.svg" alt="CoWrite" width={36} height={36} />
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>CoWrite</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
            Where ideas<br />
            <span style={{ background: "linear-gradient(135deg, #818cf8, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              come alive.
            </span>
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Real-time collaborative writing and coding. Work with your team like you&apos;re in the same room.
          </p>
        </div>
        <div className="relative space-y-4">
          {[
            { avatar: "AK", color: "#6366f1", name: "Alex Kim", text: "CoWrite replaced our entire doc workflow. The real-time sync is seamless." },
            { avatar: "SR", color: "#10b981", name: "Sam Rivera", text: "The AI assistant helps me write and debug code 3x faster." },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: t.color }}>{t.avatar}</div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <Image src="/logo.svg" alt="CoWrite" width={32} height={32} />
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>CoWrite</span>
          </div>

          <h2 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
            Don&apos;t have an account? <Link href="/auth/signup" className="font-medium" style={{ color: "#818cf8" }}>Sign up free</Link>
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl mb-5 text-sm animate-fadeIn"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", color: "var(--text-primary)" }}
                onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-normal)"; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  className="w-full h-11 px-4 pr-12 rounded-xl border text-sm focus:outline-none transition-all"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", color: "var(--text-primary)" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border-normal)"; e.target.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "var(--text-quaternary)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-quaternary)" }}>or continue as guest</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <button onClick={() => router.push("/?guest=1")}
            className="w-full h-11 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-normal)", color: "var(--text-secondary)" }}>
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
}
