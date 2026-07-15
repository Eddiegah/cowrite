"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { Send, X, MessageCircle } from "lucide-react";
import { getUserIdentity } from "@/lib/yjs-provider";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  doc: Y.Doc | null;
  provider: HocuspocusProvider | null;
  onClose: () => void;
  onNewMessage: () => void;
}

export default function ChatPanel({ doc, provider, onClose, onNewMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const identity = getUserIdentity();

  useEffect(() => {
    if (!doc) return;
    const yMessages = doc.getArray<ChatMessage>("chat");

    const update = () => {
      setMessages(yMessages.toArray());
    };
    update();
    yMessages.observe(update);
    return () => yMessages.unobserve(update);
  }, [doc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(() => {
    if (!input.trim() || !doc) return;
    const yMessages = doc.getArray<ChatMessage>("chat");
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: identity.name + identity.color,
      userName: identity.name,
      userColor: identity.color,
      text: input.trim(),
      timestamp: Date.now(),
    };
    yMessages.push([msg]);
    setInput("");
    onNewMessage();
  }, [input, doc, identity, onNewMessage]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(251,191,36,0.15)" }}>
          <MessageCircle className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Team Chat</h3>
          <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center transition-all" style={{ color: "var(--text-quaternary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "var(--text-secondary)" }} />
            <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.userId === (identity.name + identity.color);
          return (
            <div key={msg.id || i} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ background: msg.userColor }}>
                {initials(msg.userName)}
              </div>
              <div className={`flex flex-col gap-0.5 max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5">
                  {!isMe && <span className="text-[10px] font-semibold" style={{ color: msg.userColor }}>{msg.userName}</span>}
                  <span className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{formatTime(msg.timestamp)}</span>
                </div>
                <div className="px-3 py-2 rounded-2xl text-xs leading-relaxed"
                  style={{
                    background: isMe ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--bg-elevated)",
                    color: isMe ? "white" : "var(--text-primary)",
                    border: isMe ? "none" : "1px solid var(--border-subtle)",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-4 pt-2 shrink-0 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-end gap-2 p-2 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder="Message the team…"
            className="flex-1 text-sm bg-transparent focus:outline-none py-1"
            style={{ color: "var(--text-primary)" }} />
          <button onClick={send} disabled={!input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: input.trim() ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "var(--bg-hover)", color: input.trim() ? "#000" : "var(--text-quaternary)" }}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-1.5" style={{ color: "var(--text-quaternary)" }}>Messages sync in real time</p>
      </div>
    </div>
  );
}
