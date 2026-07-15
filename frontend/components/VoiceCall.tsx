"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { Phone, PhoneOff, Mic, MicOff, Users, X } from "lucide-react";
import { getUserIdentity } from "@/lib/yjs-provider";

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
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const identity = getUserIdentity();

  const startCall = async () => {
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      setInCall(true);
      setStatus("connected");
      setParticipants([{ name: identity.name + " (you)", color: identity.color, muted: false }]);

      // Signal presence via Yjs awareness
      if (provider) {
        provider.setAwarenessField("inCall", { docId, name: identity.name, color: identity.color });
      }
    } catch {
      setStatus("idle");
      alert("Could not access microphone. Please allow microphone permission.");
    }
  };

  const endCall = useCallback(() => {
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    if (provider) provider.setAwarenessField("inCall", null);
    setInCall(false);
    setStatus("idle");
    setParticipants([]);
  }, [provider]);

  const toggleMute = () => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = muted;
      setMuted(!muted);
      setParticipants(prev => prev.map((p, i) => i === 0 ? { ...p, muted: !muted } : p));
    }
  };

  // Listen for other participants via awareness
  useEffect(() => {
    if (!provider?.awareness || !inCall) return;
    const update = () => {
      const states = provider.awareness!.getStates() as Map<number, Record<string, unknown>>;
      const callParticipants: Participant[] = [{ name: identity.name + " (you)", color: identity.color, muted }];
      states.forEach((state) => {
        const callState = state.inCall as { docId: string; name: string; color: string } | null;
        if (callState && callState.docId === docId && callState.name !== identity.name) {
          callParticipants.push({ name: callState.name, color: callState.color, muted: false });
        }
      });
      setParticipants(callParticipants);
    };
    provider.awareness.on("change", update);
    return () => provider.awareness?.off("change", update);
  }, [provider, inCall, docId, identity, muted]);

  useEffect(() => { return () => { if (inCall) endCall(); }; }, [inCall, endCall]);

  const initials = (name: string) => name.replace(" (you)", "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: inCall ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.12)" }}>
          <Phone className="w-3.5 h-3.5" style={{ color: inCall ? "#34d399" : "#818cf8" }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Voice Call</h3>
          <p className="text-[11px]" style={{ color: inCall ? "#34d399" : "var(--text-quaternary)" }}>
            {status === "idle" ? "Not in a call" : status === "connecting" ? "Connecting…" : `${participants.length} participant${participants.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: "var(--text-quaternary)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {!inCall ? (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
              <Phone className="w-7 h-7" style={{ color: "#818cf8" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Start a voice call</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Collaborators in this document can join. Audio only — no video.
              </p>
            </div>
            <button onClick={startCall}
              className="flex items-center gap-2 h-11 px-6 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
              <Phone className="w-4 h-4" /> Start Call
            </button>
          </>
        ) : (
          <>
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute h-full w-full rounded-full opacity-50" style={{ background: "#34d399" }} />
                <span className="relative rounded-full w-2 h-2" style={{ background: "#34d399" }} />
              </span>
              <span className="text-xs font-semibold" style={{ color: "#34d399" }}>Live call</span>
            </div>

            {/* Participants */}
            <div className="w-full space-y-2">
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: p.color }}>
                    {initials(p.name)}
                  </div>
                  <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  {p.muted ? <MicOff className="w-4 h-4" style={{ color: "#f87171" }} /> : <Mic className="w-4 h-4" style={{ color: "#34d399" }} />}
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button onClick={toggleMute}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{ background: muted ? "rgba(248,113,113,0.15)" : "var(--bg-elevated)", border: `1px solid ${muted ? "rgba(248,113,113,0.3)" : "var(--border-normal)"}` }}>
                {muted ? <MicOff className="w-5 h-5" style={{ color: "#f87171" }} /> : <Mic className="w-5 h-5" style={{ color: "#34d399" }} />}
              </button>
              <button onClick={endCall}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-90"
                style={{ background: "rgba(239,68,68,0.9)" }}>
                <PhoneOff className="w-5 h-5 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
