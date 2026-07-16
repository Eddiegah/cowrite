"use client";

import React from "react";
import Link from "next/link";

interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message || "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[CoWrite] Page error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              The editor encountered an unexpected error.
            </p>
            <p className="text-xs font-mono mb-6 p-3 rounded-lg text-left" style={{ background: "var(--bg-elevated)", color: "#f87171" }}>
              {this.state.error}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
                Reload page
              </button>
              <Link href="/" className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-normal)", color: "var(--text-secondary)" }}>
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
