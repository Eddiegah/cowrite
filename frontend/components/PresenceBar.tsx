"use client";

import { useEffect, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

interface AwarenessUser { name: string; color: string; }
interface AwarenessState { user?: AwarenessUser; }

interface PresenceBarProps {
  provider: HocuspocusProvider | null;
  connectionStatus: "connecting" | "connected" | "disconnected";
}

export default function PresenceBar({ provider, connectionStatus }: PresenceBarProps) {
  const [users, setUsers] = useState<AwarenessUser[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!provider?.awareness) return;
    const update = () => {
      const states = provider.awareness!.getStates() as Map<number, AwarenessState>;
      const list: AwarenessUser[] = [];
      states.forEach(s => { if (s.user) list.push(s.user); });
      setUsers(list);
    };
    update();
    provider.awareness.on("change", update);
    return () => provider.awareness?.off("change", update);
  }, [provider]);

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const visible = users.slice(0, 4);
  const extra = users.length - 4;

  return (
    <div className="flex items-center gap-3">
      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        {connectionStatus === "connected" && (
          <>
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: "#34d399" }} />
              <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: "#34d399" }} />
            </span>
            <span className="text-xs font-medium hidden sm:block" style={{ color: "#34d399" }}>Live</span>
          </>
        )}
        {connectionStatus === "connecting" && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#fbbf24" }} />
            <span className="text-xs hidden sm:block" style={{ color: "#fbbf24" }}>Syncing…</span>
          </>
        )}
        {connectionStatus === "disconnected" && (
          <>
            <WifiOff className="w-3 h-3" style={{ color: "#f87171" }} />
            <span className="text-xs hidden sm:block" style={{ color: "#f87171" }}>Offline</span>
          </>
        )}
      </div>

      {/* Divider */}
      {users.length > 0 && <div className="divider" />}

      {/* Avatars */}
      {users.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowAll(v => !v)}
            className="flex items-center -space-x-2 hover:space-x-0 transition-all duration-200"
            title={`${users.length} online`}
          >
            {visible.map((u, i) => (
              <div key={i} data-tooltip={u.name}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 transition-all"
                style={{ background: u.color, borderColor: "var(--bg-base)", zIndex: visible.length - i }}>
                {initials(u.name)}
              </div>
            ))}
            {extra > 0 && (
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ background: "var(--bg-hover)", borderColor: "var(--bg-base)", color: "var(--text-secondary)" }}>
                +{extra}
              </div>
            )}
          </button>

          {/* Popover */}
          {showAll && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAll(false)} />
              <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border shadow-xl animate-scaleIn p-3"
                style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-lg)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-quaternary)" }}>
                  {users.length} online now
                </p>
                <div className="space-y-1.5">
                  {users.map((u, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: u.color }}>
                        {initials(u.name)}
                      </div>
                      <span className="text-xs truncate" style={{ color: "var(--text-primary)" }}>{u.name}</span>
                      <span className="relative flex w-1.5 h-1.5 ml-auto flex-shrink-0">
                        <span className="animate-ping absolute h-full w-full rounded-full opacity-50" style={{ background: "#34d399" }} />
                        <span className="relative rounded-full w-1.5 h-1.5" style={{ background: "#34d399" }} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
