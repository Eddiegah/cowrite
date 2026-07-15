"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Quote, Code, AlignLeft, AlignCenter, AlignRight,
  Link2, Link2Off, Image as ImageIcon, Minus,
  Download, ChevronDown, Highlighter, Type,
  Undo2, Redo2, Palette, Table as TableIcon,
  Trash2,
} from "lucide-react";

interface RichTextEditorProps {
  doc: Y.Doc;
  provider: HocuspocusProvider | null;
  synced: boolean;
  docName?: string;
  onEditorReady?: (editor: Editor) => void;
}

/* ── markdown export ── */
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
    .replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "> $1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<\/?[uo]l[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}

const TEXT_COLORS = [
  "#fafafa","#a1a1aa","#f87171","#fb923c",
  "#fbbf24","#34d399","#60a5fa","#818cf8","#f472b6","#a78bfa",
];
const HIGHLIGHT_COLORS = [
  "rgba(251,191,36,0.28)","rgba(52,211,153,0.22)","rgba(129,140,248,0.28)",
  "rgba(248,113,113,0.25)","rgba(251,146,60,0.25)",
];

export default function RichTextEditor({ doc, provider, synced, docName, onEditorReady }: RichTextEditorProps) {
  const [isReady, setIsReady]     = useState(false);
  const [words, setWords]         = useState(0);
  const [chars, setChars]         = useState(0);
  const [dropdown, setDropdown]   = useState<string | null>(null);
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const close     = useCallback(() => setDropdown(null), []);

  /* ── Editor setup ── */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false, heading: { levels: [1, 2, 3] } }),
      Collaboration.configure({ document: doc }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle, Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Image,
      HorizontalRule,
      CharacterCount,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    immediatelyRender: false,
    editorProps: { attributes: { class: "focus:outline-none" } },
    onCreate({ editor }) {
      setIsReady(true);
      const t = editor.getText();
      setWords(t.trim() ? t.trim().split(/\s+/).length : 0);
      setChars(t.length);
      onEditorReady?.(editor);
    },
    onUpdate({ editor }) {
      const t = editor.getText();
      setWords(t.trim() ? t.trim().split(/\s+/).length : 0);
      setChars(t.length);
    },
  });

  /* ── Bubble menu: show on selection ── */
  const updateBubble = useCallback(() => {
    if (!editor) return;
    const { empty } = editor.state.selection;
    if (empty) { setBubblePos(null); return; }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { setBubblePos(null); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || rect.width === 0) { setBubblePos(null); return; }
    setBubblePos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", updateBubble);
    editor.on("blur", () => setBubblePos(null));
    return () => { editor.off("selectionUpdate", updateBubble); };
  }, [editor, updateBubble]);

  /* ── Helpers ── */
  const setLink = () => {
    const prev = editor?.getAttributes("link").href as string | undefined;
    const url  = window.prompt("URL:", prev ?? "https://");
    if (url === null) return;
    if (!url) { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt("Image URL:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  const exportMd = () => {
    if (!editor) return;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([htmlToMarkdown(editor.getHTML())], { type: "text/markdown" })),
      download: `${(docName || "document").replace(/[^a-zA-Z0-9-_]/g, "_")}.md`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const inTable = editor?.isActive("table") ?? false;
  const headingLabel = editor?.isActive("heading", { level: 1 }) ? "Heading 1"
    : editor?.isActive("heading", { level: 2 }) ? "Heading 2"
    : editor?.isActive("heading", { level: 3 }) ? "Heading 3" : "Normal";

  /* ── Toolbar primitives ── */
  const Btn = ({ onClick, active, tip, disabled, children }: {
    onClick: () => void; active?: boolean; tip: string;
    disabled?: boolean; children: React.ReactNode;
  }) => (
    <button onClick={onClick} disabled={disabled} data-tooltip={tip}
      className="w-7 h-7 rounded-md flex items-center justify-center transition-all flex-shrink-0"
      style={{
        background: active ? "rgba(99,102,241,0.2)" : "transparent",
        color: active ? "#818cf8" : disabled ? "var(--text-quaternary)" : "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={e => { if (!active && !disabled) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
      onMouseLeave={e => { e.currentTarget.style.background = active ? "rgba(99,102,241,0.2)" : "transparent"; e.currentTarget.style.color = active ? "#818cf8" : "var(--text-secondary)"; }}
    >{children}</button>
  );

  const Sep = () => <div className="divider mx-0.5 flex-shrink-0" />;

  const Drop = ({ id, trigger, children }: { id: string; trigger: React.ReactNode; children: React.ReactNode }) => (
    <div className="relative flex-shrink-0">
      <button onClick={() => setDropdown(dropdown === id ? null : id)}
        className="h-7 px-2 rounded-md flex items-center gap-0.5 transition-all text-xs"
        style={{ color: "var(--text-secondary)", background: dropdown === id ? "var(--bg-hover)" : "transparent" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
        onMouseLeave={e => { if (dropdown !== id) e.currentTarget.style.background = "transparent"; }}
      >{trigger}<ChevronDown className="w-2.5 h-2.5 ml-0.5 flex-shrink-0" style={{ color: "var(--text-quaternary)" }} /></button>
      {dropdown === id && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute top-9 left-0 z-50 rounded-xl border shadow-2xl animate-scaleIn min-w-max py-1.5 overflow-hidden"
            style={{ background: "var(--bg-overlay)", borderColor: "var(--border-normal)", boxShadow: "var(--shadow-lg)" }}>
            {children}
          </div>
        </>
      )}
    </div>
  );

  const DItem = ({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) => (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left"
      style={{ color: danger ? "#f87171" : "var(--text-secondary)" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">

      {/* ════════════════ TOOLBAR ════════════════ */}
      <div className="flex items-center gap-0.5 px-4 py-2 flex-wrap shrink-0 border-b"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", overflowX: "auto", scrollbarWidth: "none" }}>

        <Btn onClick={() => editor?.chain().focus().undo().run()} tip="Undo (Ctrl+Z)" disabled={!editor?.can().undo()}><Undo2 className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().redo().run()} tip="Redo (Ctrl+Y)" disabled={!editor?.can().redo()}><Redo2 className="w-3.5 h-3.5" /></Btn>
        <Sep />

        {/* Heading dropdown */}
        <Drop id="heading" trigger={<><Type className="w-3.5 h-3.5 mr-1.5" /><span className="min-w-[52px] text-xs font-medium">{headingLabel}</span></>}>
          {([
            ["Normal",   "paragraph", 0, 400, "14px"],
            ["Heading 1","heading",   1, 700, "18px"],
            ["Heading 2","heading",   2, 650, "15px"],
            ["Heading 3","heading",   3, 600, "13px"],
          ] as const).map(([lbl, type, lvl, fw, fs]) => (
            <DItem key={lbl} onClick={() => {
              if (type === "paragraph") editor?.chain().focus().setParagraph().run();
              else editor?.chain().focus().toggleHeading({ level: lvl as 1|2|3 }).run();
              close();
            }}>
              <span style={{ fontWeight: fw, fontSize: fs, color: "var(--text-primary)" }}>{lbl}</span>
            </DItem>
          ))}
        </Drop>
        <Sep />

        <Btn onClick={() => editor?.chain().focus().toggleBold().run()}        active={editor?.isActive("bold")}      tip="Bold (Ctrl+B)">     <Bold           className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleItalic().run()}      active={editor?.isActive("italic")}    tip="Italic (Ctrl+I)">   <Italic         className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleUnderline().run()}   active={editor?.isActive("underline")} tip="Underline (Ctrl+U)"><UnderlineIcon  className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleStrike().run()}      active={editor?.isActive("strike")}    tip="Strikethrough">     <Strikethrough  className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleCode().run()}        active={editor?.isActive("code")}      tip="Inline code">       <Code           className="w-3.5 h-3.5" /></Btn>
        <Sep />

        {/* Text color */}
        <Drop id="color" trigger={
          <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
            style={{ background: (editor?.getAttributes("textStyle") as { color?: string }).color || "transparent" }} />
        }>
          <div className="px-3.5 pt-2.5 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-quaternary)" }}>Text color</p>
            <div className="grid grid-cols-5 gap-1.5">
              {TEXT_COLORS.map(c => (
                <button key={c} onClick={() => { editor?.chain().focus().setColor(c).run(); close(); }}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{ background: c,
                    boxShadow: (editor?.getAttributes("textStyle") as { color?: string }).color === c
                      ? `0 0 0 2px var(--bg-overlay),0 0 0 4px ${c}` : "none" }} />
              ))}
            </div>
            <button onClick={() => { editor?.chain().focus().unsetColor().run(); close(); }}
              className="mt-2 w-full text-center text-[11px] py-1 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Reset</button>
          </div>
        </Drop>

        {/* Highlight */}
        <Drop id="hi" trigger={<Highlighter className="w-3.5 h-3.5" style={{ color: editor?.isActive("highlight") ? "#fbbf24" : "var(--text-secondary)" }} />}>
          <div className="px-3.5 pt-2.5 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-quaternary)" }}>Highlight</p>
            <div className="flex gap-1.5">
              {HIGHLIGHT_COLORS.map(c => (
                <button key={c} onClick={() => { editor?.chain().focus().setHighlight({ color: c }).run(); close(); }}
                  className="w-6 h-6 rounded-md border transition-transform hover:scale-110"
                  style={{ background: c, borderColor: "var(--border-normal)" }} />
              ))}
            </div>
            <button onClick={() => { editor?.chain().focus().unsetHighlight().run(); close(); }}
              className="mt-2 w-full text-center text-[11px] py-1 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Remove</button>
          </div>
        </Drop>
        <Sep />

        {/* Alignment */}
        <Btn onClick={() => editor?.chain().focus().setTextAlign("left").run()}    active={editor?.isActive({ textAlign: "left" })}    tip="Left">   <AlignLeft   className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().setTextAlign("center").run()}  active={editor?.isActive({ textAlign: "center" })}  tip="Center"> <AlignCenter className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().setTextAlign("right").run()}   active={editor?.isActive({ textAlign: "right" })}   tip="Right">  <AlignRight  className="w-3.5 h-3.5" /></Btn>
        <Sep />

        {/* Lists */}
        <Btn onClick={() => editor?.chain().focus().toggleBulletList().run()}  active={editor?.isActive("bulletList")}  tip="Bullet list"><List        className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} tip="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleTaskList().run()}    active={editor?.isActive("taskList")}    tip="Task list"><ListChecks   className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleBlockquote().run()}  active={editor?.isActive("blockquote")}  tip="Quote"><Quote          className="w-3.5 h-3.5" /></Btn>
        <Sep />

        {/* Headings shortcuts */}
        <Btn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading",{level:1})} tip="H1"><Heading1 className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading",{level:2})} tip="H2"><Heading2 className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading",{level:3})} tip="H3"><Heading3 className="w-3.5 h-3.5" /></Btn>
        <Sep />

        {/* Insert */}
        <Btn onClick={setLink}        active={editor?.isActive("link")} tip="Link"><Link2        className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={insertImage}    tip="Image"><ImageIcon    className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={() => editor?.chain().focus().setHorizontalRule().run()} tip="Horizontal rule"><Minus className="w-3.5 h-3.5" /></Btn>

        {/* Table */}
        <Drop id="tbl" trigger={<TableIcon className="w-3.5 h-3.5" />}>
          {!inTable ? (
            <DItem onClick={() => { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); close(); }}>
              <TableIcon className="w-3.5 h-3.5" /> Insert 3×3 table
            </DItem>
          ) : (
            <>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>Table</div>
              <DItem onClick={() => { editor?.chain().focus().addRowAfter().run(); close(); }}><span>＋</span> Add row below</DItem>
              <DItem onClick={() => { editor?.chain().focus().addColumnAfter().run(); close(); }}><span>＋</span> Add column right</DItem>
              <DItem onClick={() => { editor?.chain().focus().deleteRow().run(); close(); }}><span>－</span> Delete row</DItem>
              <DItem onClick={() => { editor?.chain().focus().deleteColumn().run(); close(); }}><span>－</span> Delete column</DItem>
              <div className="my-1 h-px" style={{ background: "var(--border-subtle)" }} />
              <DItem danger onClick={() => { editor?.chain().focus().deleteTable().run(); close(); }}><Trash2 className="w-3.5 h-3.5" /> Delete table</DItem>
            </>
          )}
        </Drop>

        <div className="flex-1" />
        <button onClick={exportMd} data-tooltip="Export as Markdown"
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-all flex-shrink-0"
          style={{ color: "var(--text-quaternary)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-quaternary)"; }}>
          <Download className="w-3 h-3" /> .md
        </button>
      </div>

      {/* ════════════════ BUBBLE MENU ════════════════ */}
      {editor && bubblePos && !editor.state.selection.empty && (
        <div ref={bubbleRef} className="bubble-menu fixed z-50"
          style={{ left: bubblePos.x, top: bubblePos.y, transform: "translateX(-50%) translateY(-100%)" }}
          onMouseDown={e => e.preventDefault()}>
          <button onClick={() => editor.chain().focus().toggleBold().run()}      className={editor.isActive("bold")      ? "is-active" : ""} title="Bold"><Bold          size={13} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()}    className={editor.isActive("italic")    ? "is-active" : ""} title="Italic"><Italic        size={13} /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "is-active" : ""} title="Underline"><UnderlineIcon size={13} /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()}    className={editor.isActive("strike")    ? "is-active" : ""} title="Strike"><Strikethrough size={13} /></button>
          <button onClick={() => editor.chain().focus().toggleCode().run()}      className={editor.isActive("code")      ? "is-active" : ""} title="Code"><Code           size={13} /></button>
          <div className="bm-divider" />
          <button onClick={() => editor.chain().focus().toggleHighlight({ color: "rgba(251,191,36,0.28)" }).run()} className={editor.isActive("highlight") ? "is-active" : ""} title="Highlight"><Highlighter size={13} /></button>
          <button onClick={setLink}  className={editor.isActive("link") ? "is-active" : ""} title="Link"><Link2    size={13} /></button>
          {editor.isActive("link") && <button onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link"><Link2Off size={13} /></button>}
          <div className="bm-divider" />
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading",{level:1}) ? "is-active" : ""} title="H1" style={{ fontSize: 12, fontWeight: 700 }}>H1</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading",{level:2}) ? "is-active" : ""} title="H2" style={{ fontSize: 12, fontWeight: 700 }}>H2</button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "is-active" : ""} title="Quote"><Quote size={13} /></button>
        </div>
      )}

      {/* ════════════════ EDITOR CANVAS ════════════════ */}
      <div className="flex-1 overflow-y-auto relative" style={{ background: "var(--bg-base)" }}>
        {(!isReady || !synced) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3" style={{ background: "var(--bg-base)" }}>
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border-normal)", borderTopColor: "var(--accent)" }} />
            <p className="text-xs" style={{ color: "var(--text-quaternary)" }}>Loading document…</p>
          </div>
        )}
        <div className={`transition-opacity duration-300 ${isReady && synced ? "opacity-100" : "opacity-0"}`}>
          <div className="max-w-[740px] mx-auto px-8 sm:px-14 py-14">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* ════════════════ STATUS BAR ════════════════ */}
      <div className="flex items-center justify-between px-5 py-1.5 border-t shrink-0"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-quaternary)" }}>
          <span>{words.toLocaleString()} word{words !== 1 ? "s" : ""}</span>
          <span className="divider" style={{ height: "12px" }} />
          <span>{chars.toLocaleString()} char{chars !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-quaternary)" }}>
          <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-hover)", border: "1px solid var(--border-subtle)" }}>Ctrl+Z</kbd>
          <span>undo</span>
          <span className="divider" style={{ height: "12px" }} />
          <span>Rich Text</span>
        </div>
      </div>

    </div>
  );
}
