"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendAIMessage, newMessage, type AIMessage, type AIContext } from "@/lib/ai";
import { Bot, Send, X, RotateCcw, Copy, Check, ChevronDown, Sparkles, User } from "lucide-react";

interface AIPanelProps {
  context: AIContext;
  onClose: () => void;
  onInsert?: (text: string) => void;
}

const QUICK_PROMPTS_DOC = [
  "Summarize this document",
  "Improve the writing style",
  "Fix grammar and spelling",
  "Make it more concise",
  "Add a professional tone",
  "Write an introduction",
];

const QUICK_PROMPTS_CODE = [
  "Explain this code",
  "Find and fix bugs",
  "Add error handling",
  "Optimize for performance",
  "Add JSDoc comments",
  "Write unit tests",
];

function MessageBubble({ msg, onCopy, onInsert }: {
  msg: AIMessage;
  onCopy: (text: string) => void;
  onInsert?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Format markdown-style content
  const formatted = msg.content
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="ai-code-block" data-lang="$1">$2</pre>')
    .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""} group`}>
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: isUser ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--bg-hover)" }}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isUser ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--bg-elevated)",
            color: isUser ? "white" : "var(--text-primary)",
            border: isUser ? "none" : "1px solid var(--border-subtle)",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}
          dangerouslySetInnerHTML={{ __html: formatted }} />

        {/* Actions */}
        {!isUser && (
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all"
              style={{ color: "var(--text-quaternary)", background: "var(--bg-elevated)" }}>
              {copied ? <><Check className="w-2.5 h-2.5" /> Copied</> : <><Copy className="w-2.5 h-2.5" /> Copy</>}
            </button>
            {onInsert && (
              <button onClick={() => onInsert(msg.content)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all"
                style={{ color: "#818cf8", background: "rgba(99,102,241,0.1)" }}>
                <ChevronDown className="w-2.5 h-2.5" /> Insert
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIPanel({ context, onClose, onInsert }: AIPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    newMessage("assistant", `Hi! I'm your CoWrite AI assistant. I can help you ${context.mode === "code" ? "write, debug, and explain code" : "write, edit, and improve your document"}. What would you like to work on?`),
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = context.mode === "code" ? QUICK_PROMPTS_CODE : QUICK_PROMPTS_DOC;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg = newMessage("user", trimmed);
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const all = [...messages, userMsg];
    const reply = await sendAIMessage(all, context);
    setMessages(prev => [...prev, newMessage("assistant", reply)]);
    setLoading(false);
  }, [loading, messages, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>AI Assistant</h3>
          <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
            {context.mode === "code" ? `${context.language || "Code"} • Powered by AI` : "Writing • Powered by AI"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMessages([newMessage("assistant", "Chat cleared. How can I help you?")])}
            data-tooltip="Clear chat"
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{ color: "var(--text-quaternary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-quaternary)"; }}>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} data-tooltip="Close"
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{ color: "var(--text-quaternary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-quaternary)"; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-3 py-3 border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-quaternary)" }}>Quick prompts</p>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => send(p)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:opacity-90"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-normal)", color: "var(--text-secondary)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onCopy={copyToClipboard} onInsert={onInsert} />
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--bg-hover)" }}>
              <Bot className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#818cf8", animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-4 pt-2 shrink-0 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-end gap-2 p-2 rounded-xl border transition-all"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (Enter to send)"
            rows={1}
            className="flex-1 text-sm bg-transparent focus:outline-none resize-none leading-relaxed py-1"
            style={{ color: "var(--text-primary)", maxHeight: "120px", scrollbarWidth: "none" }}
          />
          <button onClick={() => send(input)} disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() && !loading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--bg-hover)",
              color: input.trim() && !loading ? "white" : "var(--text-quaternary)",
            }}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-quaternary)" }}>
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
