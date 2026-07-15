"use client";

import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Hash, List, FileText, ChevronRight, X } from "lucide-react";

interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

interface DocSidebarProps {
  editor: Editor | null;
  docName: string;
  onClose: () => void;
}

export default function DocSidebar({ editor, docName, onClose }: DocSidebarProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"outline" | "info">("outline");

  useEffect(() => {
    if (!editor) return;
    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level as number,
            text: node.textContent,
            id: `heading-${pos}`,
          });
        }
      });
      setHeadings(items);
    };
    extractHeadings();
    editor.on("update", extractHeadings);
    return () => { editor.off("update", extractHeadings); };
  }, [editor]);

  const scrollToHeading = (text: string) => {
    if (!editor) return;
    let found = false;
    editor.state.doc.descendants((node, pos) => {
      if (!found && node.type.name === "heading" && node.textContent === text) {
        const domNode = editor.view.domAtPos(pos + 1)?.node;
        if (domNode instanceof Element) {
          domNode.scrollIntoView({ behavior: "smooth", block: "start" });
          found = true;
        }
      }
    });
  };

  const wordCount = editor ? (editor.getText().trim().split(/\s+/).filter(Boolean).length) : 0;
  const charCount = editor ? editor.getText().length : 0;
  const paraCount = editor ? editor.state.doc.childCount : 0;
  const headingCount = headings.length;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
        <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--text-primary)" }}>Document</span>
        <button onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
          style={{ color: "var(--text-quaternary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
        {[["outline", "Outline", List], ["info", "Info", FileText]].map(([id, label, Icon]) => (
          <button key={id as string}
            onClick={() => setActiveTab(id as "outline" | "info")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2"
            style={{
              color: activeTab === id ? "var(--accent-hover)" : "var(--text-tertiary)",
              borderColor: activeTab === id ? "var(--accent)" : "transparent",
            }}>
            <Icon className="w-3.5 h-3.5" />
            {label as string}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "outline" && (
          <div className="py-3">
            {headings.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Hash className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color: "var(--text-quaternary)" }} />
                <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>No headings yet</p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-quaternary)" }}>Add H1, H2, or H3 headings to build an outline</p>
              </div>
            ) : (
              <div className="px-2">
                {headings.map((h, i) => (
                  <button key={i}
                    onClick={() => scrollToHeading(h.text)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all group"
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span className="text-[10px] font-bold flex-shrink-0 w-5 text-center rounded"
                      style={{ color: "var(--accent)", background: "rgba(99,102,241,0.1)" }}>H{h.level}</span>
                    <span className="text-xs truncate group-hover:text-white transition-colors"
                      style={{ color: h.level === 1 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: h.level === 1 ? 600 : 400 }}>
                      {h.text || "(empty heading)"}
                    </span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="px-4 py-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-quaternary)" }}>Document stats</p>
            {[
              ["Words", wordCount.toLocaleString()],
              ["Characters", charCount.toLocaleString()],
              ["Headings", headingCount],
              ["Paragraphs", paraCount],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between py-2 border-b"
                style={{ borderColor: "var(--border-subtle)" }}>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label as string}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{value as string}</span>
              </div>
            ))}
            <div className="mt-4 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-quaternary)" }}>Reading time</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                ~{Math.max(1, Math.round(wordCount / 200))} min read
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
