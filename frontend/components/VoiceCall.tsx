"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { Phone, PhoneOff, Mic, MicOff, X } from "lucide-react";

interface VoiceCallProps {
  docId: string;
  provider: HocuspocusProvider | null;
  onClose: () => void;
}

interface Participant { name: string; color: string; muted: boolean; }

export default function VoiceCall({ docId, provider, onClose }: VoiceCallProps) {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState<"idle"|"connecting"|"connected">("idle");
  const localStream = useRef<MediaStream | null>(null);

  // Safe: only runs client-side
  const getIdentity = () => {
    if (typeof window === "undefined") return { name: "Anonymous", color: "#6366f1" };
    try { return JSON.parse(localStorage.getItem("cowrite_user") || "{}") as { name: string; color: string }; }
    catch { return { name: "Anonymous", color: "#6366f1" }; }
  };

  const startCall = async () => {
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      const id = getIdentity();
      setInCall(true);
      setStatus("connected");
      setParticipants([{ name: id.name + " (you)", color: id.color, muted: false }]);
      if (provider) provider.setAwarenessField("inCall", { docId, name: id.name, color: id.color });
    } catch {
      setStatus("idle");
      alert("Could not access microphone. Please allow microphone permission in your browser.");
    }
  };

  const endCall = useCallback(() => {
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    if (provider) provider.setAwarenessField("inCall", null);
    setInCall(false); setStatus("idle"); setParticipants([]);
  }, [provider]);

  const toggleMute = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (track) { track.enabled = muted; setMuted(!muted); setParticipants(p => p.map((x,i) => i===0 ? {...x, muted:!muted} : x)); }
  };

  useEffect(() => {
    if (!provider?.awareness || !inCall) return;
    const id = getIdentity();
    const update = () => {
      const states = provider.awareness!.getStates() as Map<number, Record<string,unknown>>;
      const list: Participant[] = [{ name: id.name + " (you)", color: id.color, muted }];
      states.forEach(s => {
        const c = s.inCall as { docId:string; name:string; color:string }|null;
        if (c && c.docId === docId && c.name !== id.name) list.push({ name: c.name, color: c.color, muted: false });
      });
      setParticipants(list);
    };
    provider.awareness.on("change", update);
    return () => provider.awareness?.off("change", update);
  }, [provider, inCall, docId, muted]);

  useEffect(() => { return () => { if (inCall) endCall(); }; }, [inCall, endCall]);

  const initials = (n: string) => n.replace(" (you)","").split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: inCall ? "var(--green-subtle)" : "var(--accent-subtle)" }}>
          <Phone className="w-3.5 h-3.5" style={{ color: inCall ? "var(--green)" : "var(--accent)" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Voice Call</p>
          <p className="text-[11px]" style={{ color: inCall ? "var(--green)" : "var(--text-quaternary)" }}>
            {status === "idle" ? "Not in a call" : status === "connecting" ? "Connecting…" : `${participants.length} participant${participants.length!==1?"s":""}`}
          </p>
        </div>
        <button onClick={onClose} className="sidebar-icon-btn"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5">
        {!inCall ? (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--accent-subtle)" }}>
              <Phone className="w-7 h-7" style={{ color: "var(--accent)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Start a voice call</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Everyone in this document can join. Audio only.</p>
            </div>
            <button onClick={startCall} className="flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm text-white"
              style={{ background: "linear-gradient(135deg,var(--green),#4ade80)", boxShadow: "0 4px 16px var(--green-subtle)" }}>
              <Phone className="w-4 h-4" /> Start Call
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--green-subtle)", border: "1px solid rgba(35,197,94,0.2)" }}>
              <span className="relative flex w-2 h-2"><span className="animate-ping absolute h-full w-full rounded-full opacity-50" style={{ background: "var(--green)" }} /><span className="relative rounded-full w-2 h-2" style={{ background: "var(--green)" }} /></span>
              <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>Live</span>
            </div>
            <div className="w-full space-y-2">
              {participants.map((p,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: p.color }}>{initials(p.name)}</div>
                  <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  {p.muted ? <MicOff className="w-4 h-4" style={{ color: "var(--red)" }} /> : <Mic className="w-4 h-4" style={{ color: "var(--green)" }} />}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={toggleMute} className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{ background: muted ? "rgba(239,68,68,0.12)" : "var(--bg-elevated)", border: `1px solid ${muted?"rgba(239,68,68,0.3)":"var(--border-normal)"}` }}>
                {muted ? <MicOff className="w-5 h-5" style={{ color: "var(--red)" }} /> : <Mic className="w-5 h-5" style={{ color: "var(--green)" }} />}
              </button>
              <button onClick={endCall} className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--red)" }}>
                <PhoneOff className="w-5 h-5 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
