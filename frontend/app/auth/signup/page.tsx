"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signUp } from "@/lib/auth";
import { Eye, EyeOff, ArrowRight, AlertCircle, Check } from "lucide-react";

const FEATURES = [
  "Real-time collaboration with live cursors",
  "Rich text & code editor in one app",
  "Built-in AI writing & coding assistant",
  "File import — open your existing work",
  "Share documents with a single link",
  "Works offline, syncs when reconnected",
];

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwColors = ["", "#ef4444", "#f59e0b", "#10b981"];
  const pwLabels = ["", "Weak", "Fair", "Strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const result = signUp(name, email, password);
    setLoading(false);
    if ("error" in result) { setError(result.error); return; }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10">
            <Image src="/logo.svg" alt="CoWrite" width={32} height={32} />
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>CoWrite</span>
          </div>

          <h2 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Create your account</h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
            Already have an account? <Link href="/auth/signin" className="font-medium" style={{ color: "#818cf8" }}>Sign in</Link>
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl mb-5 text-sm animate-fadeIn"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full name", value: name, set: setName, type: "text", placeholder: "Alex Chen", auto: "name" },
              { label: "Email", value: email, set: setEmail, type: "email", placeholder: "you@example.com", auto: "email" },
            ].map(({ label, value, set, type, placeholder, auto }) => (
              <div key={label}>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} autoComplete={auto}
                  className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", color: "var(--text-primary)" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border-normal)"; e.target.style.boxShadow = "none"; }} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password"
                  className="w-full h-11 px-4 pr-12 rounded-xl border text-sm focus:outline-none transition-all"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)", color: "var(--text-primary)" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border-normal)"; e.target.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "var(--text-quaternary)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(i => <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= pwStrength ? pwColors[pwStrength] : "var(--border-subtle)" }} />)}
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "var(--text-quaternary)" }}>
            By signing up you agree to our Terms of Service.
          </p>
        </div>
      </div>

      {/* Right — features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d0d10 0%, #13111f 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", transform: "translate(-50%, -50%)" }} />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
            ✦ Everything you need to write and build
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight" style={{ letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
            One app.<br />Infinite possibilities.
          </h2>
          <p className="text-sm mb-10 max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Write docs, build code, collaborate live. CoWrite is the only tool your team needs.
          </p>
          <ul className="space-y-3.5">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)" }}>
                  <Check className="w-3 h-3" style={{ color: "#818cf8" }} />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
