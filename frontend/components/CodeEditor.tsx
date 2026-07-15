"use client";

import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { defaultKeymap, indentWithTab, historyKeymap, history } from "@codemirror/commands";
import { searchKeymap, search } from "@codemirror/search";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle, foldGutter, foldKeymap } from "@codemirror/language";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { Download, ChevronDown, Search } from "lucide-react";

export type CodeLanguage = "javascript" | "typescript" | "python" | "css" | "html" | "markdown" | "text";

const LANGS: { value: CodeLanguage; label: string; ext: string }[] = [
  { value: "javascript", label: "JavaScript", ext: "js" },
  { value: "typescript", label: "TypeScript", ext: "ts" },
  { value: "python", label: "Python", ext: "py" },
  { value: "css", label: "CSS", ext: "css" },
  { value: "html", label: "HTML", ext: "html" },
  { value: "markdown", label: "Markdown", ext: "md" },
  { value: "text", label: "Plain Text", ext: "txt" },
];

function getLangExt(lang: CodeLanguage) {
  switch (lang) {
    case "javascript": return javascript();
    case "typescript": return javascript({ typescript: true });
    case "python": return python();
    case "css": return css();
    case "html": return html();
    case "markdown": return markdown();
    default: return null;
  }
}

interface CodeEditorProps {
  doc: Y.Doc;
  provider: HocuspocusProvider | null;
  synced: boolean;
  initialLanguage?: CodeLanguage;
  onLanguageChange?: (lang: CodeLanguage) => void;
  documentName?: string;
}

export default function CodeEditor({ doc, provider, synced, initialLanguage = "javascript", onLanguageChange, documentName = "code" }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [language, setLanguage] = useState<CodeLanguage>(initialLanguage);
  const [lineCount, setLineCount] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !provider) return;
    const yText = doc.getText("codemirror");

    const state = EditorState.create({
      doc: yText.toString(),
      extensions: [
        history(),
        lineNumbers(),
        foldGutter(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        indentOnInput(),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap]),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        ...(getLangExt(language) ? [getLangExt(language)!] : []),
        oneDark,
        search({ top: true }),
        yCollab(yText, provider.awareness),
        EditorView.theme({
          "&": { height: "100%", fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",Menlo,monospace', fontSize: "13.5px" },
          ".cm-scroller": { overflow: "auto", paddingTop: "8px", paddingBottom: "8px" },
          ".cm-content": { caretColor: "#818cf8", padding: "0 8px" },
          ".cm-focused .cm-cursor": { borderLeftColor: "#818cf8", borderLeftWidth: "2px" },
          ".cm-gutters": { background: "transparent", borderRight: "1px solid var(--border-subtle)", color: "var(--text-quaternary)" },
          ".cm-activeLineGutter": { background: "rgba(99,102,241,0.08)", color: "var(--text-tertiary)" },
          ".cm-activeLine": { background: "rgba(99,102,241,0.05)" },
          ".cm-searchMatch": { background: "rgba(251,191,36,0.25)", border: "1px solid rgba(251,191,36,0.5)" },
          ".cm-searchMatch.cm-searchMatch-selected": { background: "rgba(99,102,241,0.4)" },
          ".cm-foldGutter": { paddingLeft: "4px" },
          ".cm-editor": { background: "var(--bg-base)" },
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) setLineCount(update.state.doc.lines);
        }),
      ],
    });

    setLineCount(state.doc.lines);
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, provider, language]);

  const handleLangChange = (lang: CodeLanguage) => {
    setLanguage(lang); setLangMenuOpen(false); onLanguageChange?.(lang);
  };

  const handleExport = () => {
    if (!viewRef.current) return;
    const content = viewRef.current.state.doc.toString();
    const ext = LANGS.find(l => l.value === language)?.ext ?? "txt";
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([content], { type: "text/plain" })),
      download: `${(documentName).replace(/[^a-zA-Z0-9-_]/g,"_")}.${ext}`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const currentLang = LANGS.find(l => l.value === language);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0 border-b" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
        {/* Language picker */}
        <div className="relative">
          <button onClick={() => setLangMenuOpen(v => !v)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-normal)", color: "var(--text-secondary)" }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: language === "javascript" ? "#f7df1e" : language === "typescript" ? "#3178c6" : language === "python" ? "#3776ab" : "#818cf8" }} />
            {currentLang?.label}
            <ChevronDown className="w-3 h-3" style={{ color: "var(--text-quaternary)" }} />
          </button>
          {langMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
              <div className="absolute top-9 left-0 z-20 w-40 rounded-xl border shadow-xl animate-scaleIn py-1.5" style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)" }}>
                {LANGS.map(l => (
                  <button key={l.value} onClick={() => handleLangChange(l.value)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors text-left"
                    style={{ color: language === l.value ? "#818cf8" : "var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: l.value === "javascript" ? "#f7df1e" : l.value === "typescript" ? "#3178c6" : l.value === "python" ? "#3776ab" : "var(--border-normal)" }} />
                    {l.label}
                    {language === l.value && <span className="ml-auto text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tip */}
        <span className="text-[11px] hidden md:block" style={{ color: "var(--text-quaternary)" }}>Ctrl+F to search</span>

        <div className="flex-1" />

        {/* Export */}
        <button onClick={handleExport}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-all"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
          <Download className="w-3 h-3" /> .{currentLang?.ext}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden relative cm-host" style={{ background: "var(--bg-base)" }}>
        {!synced && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "var(--bg-base)" }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-normal)", borderTopColor: "#818cf8" }} />
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Loading document…</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full" />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-1.5 border-t shrink-0" style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
        <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{lineCount} line{lineCount !== 1 ? "s" : ""}</span>
        <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{currentLang?.label}</span>
      </div>
    </div>
  );
}
