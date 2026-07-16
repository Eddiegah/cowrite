"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { Send, X, MessageCircle } from "lucide-react";

interface ChatMessage { id: string; userId: string; userName: string; userColor: string; text: string; timestamp: number; }

interface ChatPanelProps {
  doc: Y.Doc | null;
  provider: HocuspocusProvider | null;
  onClose: () => void;
  onNewMessage: () => void;
}

export default function ChatPanel({ doc, onClose, onNewMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Safe identity getter — only runs client-side
  const getIdentity = () => {
    if (typeof window === "undefined") return { name: "Anonymous", color: "#6366f1" };
    try { return JSON.parse(localStorage.getItem("cowrite_user") || "{}") as { name: string; color: string }; }
    catch { return { name: "Anonymous", color: "#6366f1" }; }
  };

  useEffect(() => {
    if (!doc) return;
    const yMessages = doc.getArray<ChatMessage>("chat");
    const update = () => setMessages(yMessages.toArray());
    update();
    yMessages.observe(update);
    return () => yMessages.unobserve(update);
  }, [doc]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(() => {
    if (!input.trim() || !doc) return;
    const id = getIdentity();
    const yMessages = doc.getArray<ChatMessage>("chat");
    yMessages.push([{ id: `msg_${Date.now()}`, userId: id.name + id.color, userName: id.name, userColor: id.color, text: input.trim(), timestamp: Date.now() }]);
    setInput(""); onNewMessage();
  }, [input, doc, onNewMessage]);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const initials = (n: string) => n.split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2);

  const myId = typeof window !== "undefined" ? (() => { try { const u = JSON.parse(localStorage.getItem("cowrite_user")||"{}") as {name:string;color:string}; return u.name+u.color; } catch { return ""; } })() : "";

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(251,191,36,0.12)" }}>
          <MessageCircle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Team Chat</p>
          <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{messages.length} message{messages.length!==1?"s":""}</p>
        </div>
        <button onClick={onClose} className="sidebar-icon-btn"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "var(--text-secondary)" }} />
            <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.userId === myId;
          return (
            <div key={msg.id||i} className={`flex gap-2 ${isMe?"flex-row-reverse":""}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5" style={{ background: msg.userColor }}>{initials(msg.userName)}</div>
              <div className={`flex flex-col gap-0.5 max-w-[82%] ${isMe?"items-end":"items-start"}`}>
                <div className="flex items-center gap-1.5">
                  {!isMe && <span className="text-[10px] font-semibold" style={{ color: msg.userColor }}>{msg.userName}</span>}
                  <span className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{formatTime(msg.timestamp)}</span>
                </div>
                <div className="px-3 py-2 rounded-2xl text-xs leading-relaxed"
                  style={{
                    background: isMe ? "linear-gradient(135deg,var(--accent),var(--accent-hover))" : "var(--bg-elevated)",
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

      <div className="px-3 pb-4 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-end gap-2 p-2 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Message the team…"
            className="flex-1 text-sm bg-transparent focus:outline-none py-1"
            style={{ color: "var(--text-primary)" }} />
          <button onClick={send} disabled={!input.trim()} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: input.trim() ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "var(--bg-hover)", color: input.trim() ? "#000" : "var(--text-quaternary)" }}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-1.5" style={{ color: "var(--text-quaternary)" }}>Enter to send · messages sync in real time</p>
      </div>
    </div>
  );
}
