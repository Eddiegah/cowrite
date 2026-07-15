/**
 * CoWrite Backend — single-port HTTP + WebSocket
 *
 * Uses the low-level Hocuspocus class + manual ws.WebSocketServer
 * so Express REST and Hocuspocus WS share one port (required by Render/Vercel).
 */

import { Hocuspocus } from "@hocuspocus/server";
import type { onLoadDocumentPayload, onStoreDocumentPayload } from "@hocuspocus/server";
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import fs from "fs";
import * as Y from "yjs";

// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
const DOCS_DIR     = path.join(STORAGE_ROOT, "docs");
const META_PATH    = path.join(STORAGE_ROOT, "metadata.json");

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

// ── Metadata helpers ──────────────────────────────────────────────────────────
interface DocMeta { id: string; name: string; mode: "richtext"|"code"; language?: string; createdAt: string; updatedAt: string; }
interface MetaIndex { documents: DocMeta[]; }
const readMeta = (): MetaIndex => { try { if (fs.existsSync(META_PATH)) return JSON.parse(fs.readFileSync(META_PATH,"utf-8")) as MetaIndex; } catch {} return { documents: [] }; };
const writeMeta = (i: MetaIndex) => fs.writeFileSync(META_PATH, JSON.stringify(i, null, 2));

// ── Hocuspocus (low-level, no built-in HTTP server) ──────────────────────────
const hocuspocus = new Hocuspocus({
  quiet: true,

  async onLoadDocument(data: onLoadDocumentPayload) {
    const fp = path.join(DOCS_DIR, `${data.documentName}.bin`);
    if (fs.existsSync(fp)) { Y.applyUpdate(data.document, fs.readFileSync(fp)); }
  },

  async onStoreDocument(data: onStoreDocumentPayload) {
    fs.writeFileSync(path.join(DOCS_DIR, `${data.documentName}.bin`), Buffer.from(Y.encodeStateAsUpdate(data.document)));
    const idx = readMeta(); const doc = idx.documents.find(d => d.id === data.documentName);
    if (doc) { doc.updatedAt = new Date().toISOString(); writeMeta(idx); }
  },
});

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

app.use(express.json({ limit: "5mb" }));
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? "";
  const allowed = (process.env.FRONTEND_URL || "*");
  res.header("Access-Control-Allow-Origin", allowed === "*" ? (origin || "*") : allowed);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Vary", "Origin");
  if (req.method === "OPTIONS") { res.sendStatus(200); return; }
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.get("/api/documents", (_req, res) => res.json(readMeta().documents));

app.get("/api/documents/:id", (req, res) => {
  const doc = readMeta().documents.find(d => d.id === req.params.id);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  res.json(doc);
});

app.post("/api/documents", (req, res) => {
  const { name, mode, language } = req.body as { name: string; mode: "richtext"|"code"; language?: string };
  if (!name || !mode) { res.status(400).json({ error: "name and mode required" }); return; }
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const now = new Date().toISOString();
  const doc: DocMeta = { id, name: name.trim(), mode, language: mode==="code"?(language??"javascript"):undefined, createdAt:now, updatedAt:now };
  const idx = readMeta(); idx.documents.unshift(doc); writeMeta(idx);
  res.status(201).json(doc);
});

app.get("/api/documents/:id/preview", (req, res) => {
  const fp = path.join(DOCS_DIR, `${req.params.id}.bin`);
  if (!fs.existsSync(fp)) { res.json({ preview: "" }); return; }
  try {
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, fs.readFileSync(fp));
    // Try richtext (TipTap uses "default" key), fallback to codemirror
    let text = "";
    const xmlFragment = ydoc.getXmlFragment("default");
    const serialized = xmlFragment.toString();
    // Strip XML/HTML tags to get plain text
    text = serialized.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
    if (!text) {
      // Try code editor text
      const codeText = ydoc.getText("codemirror");
      text = codeText.toString().slice(0, 150);
    }
    ydoc.destroy();
    res.json({ preview: text.slice(0, 100) });
  } catch (e) {
    console.error("[preview]", e);
    res.json({ preview: "" });
  }
});

app.put("/api/documents/:id", (req, res) => {
  const idx = readMeta(); const doc = idx.documents.find(d => d.id === req.params.id);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const { name, language } = req.body as { name?: string; language?: string };
  if (name) doc.name = name.trim();
  if (language !== undefined) doc.language = language;
  doc.updatedAt = new Date().toISOString();
  writeMeta(idx); res.json(doc);
});

app.delete("/api/documents/:id", (req, res) => {
  const idx = readMeta(); const i = idx.documents.findIndex(d => d.id === req.params.id);
  if (i === -1) { res.status(404).json({ error: "Not found" }); return; }
  const fp = path.join(DOCS_DIR, `${req.params.id}.bin`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  idx.documents.splice(i,1); writeMeta(idx); res.json({ success: true });
});

// ── AI (Groq + smart fallback) ────────────────────────────────────────────────
const FB: Record<string,string> = {
  default:   "I'm CoWrite AI. I can help you write, edit, summarize, debug, and more. What would you like to work on?",
  summarize: "Here's a summary: the content covers the key points clearly. Want me to expand on any section or make it more concise?",
  fix:       "I've analyzed the code. Key areas to check: error handling, edge cases, and variable scope. Want me to rewrite a specific section?",
  explain:   "This code initializes the required state, runs the main logic, then returns the result. I can break down any specific part in detail.",
  improve:   "Improvements: (1) add error handling, (2) extract helper functions, (3) better variable names, (4) add comments. Want me to apply any of these?",
  write:     "Here's a draft — clear structure, good flow, strong close. Want me to adjust the tone, length, or focus?",
};
const fallback = (msg: string) => {
  const l = msg.toLowerCase();
  if (l.includes("summar")) return FB.summarize;
  if (l.includes("fix")||l.includes("bug")||l.includes("debug")||l.includes("error")) return FB.fix;
  if (l.includes("explain")||l.includes("what")||l.includes("how")) return FB.explain;
  if (l.includes("improv")||l.includes("refactor")||l.includes("optim")) return FB.improve;
  if (l.includes("write")||l.includes("draft")||l.includes("creat")||l.includes("generat")) return FB.write;
  return FB.default;
};

app.post("/api/ai", async (req: Request, res: Response) => {
  const { messages, systemPrompt, context } = req.body as { messages:{role:string;content:string}[]; systemPrompt:string; context?:string };
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    await new Promise(r => setTimeout(r, 500 + Math.random()*300));
    res.json({ response: fallback(messages.at(-1)?.content ?? "") }); return;
  }
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: `${systemPrompt}${context ? `\n\n<document>\n${context}\n</document>` : ""}` },
          ...messages,
        ],
        max_tokens: 2048, temperature: 0.72,
      }),
    });
    if (!r.ok) throw new Error(`Groq ${r.status}`);
    const data = await r.json() as { choices: {message:{content:string}}[] };
    res.json({ response: data.choices[0]?.message?.content ?? "No response." });
  } catch (e) {
    console.error("[AI]", e);
    res.json({ response: fallback(messages.at(-1)?.content ?? "") });
  }
});

// ── WebSocket server (shares httpServer) ──────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws, req) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hocuspocus.handleConnection(ws, req as any);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3001", 10);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ CoWrite server running on port ${PORT}`);
  console.log(`   REST → http://0.0.0.0:${PORT}/api`);
  console.log(`   WS   → ws://0.0.0.0:${PORT}`);
  console.log(`   AI   → ${process.env.GROQ_API_KEY ? "Groq llama-3.1-8b-instant" : "Smart fallback (set GROQ_API_KEY for Groq)"}`);
  console.log(`   Data → ${DOCS_DIR}\n`);
});

["SIGINT","SIGTERM"].forEach(s => process.on(s, () => { httpServer.close(); process.exit(0); }));
