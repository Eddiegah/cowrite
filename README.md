<div align="center">

<br/>

<img src="frontend/public/logo.svg" width="90" height="90" alt="CoWrite Logo" />

<br/>
<br/>

# CoWrite

### The collaborative editor that thinks with you.

**Real-time documents · Code editor · Built-in AI · Voice calls · Team chat**

<br/>

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-cowrite--tawny.vercel.app-6366f1?style=for-the-badge)](https://cowrite-tawny.vercel.app)
&nbsp;
[![Backend](https://img.shields.io/badge/⚙️%20API-Render-46E3B7?style=for-the-badge)](https://cowrite-backend-2nv1.onrender.com/health)
&nbsp;
[![GitHub](https://img.shields.io/badge/📦%20Source-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Eddiegah/cowrite)

<br/>

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Yjs](https://img.shields.io/badge/Yjs%20CRDTs-F6821F?style=flat-square)
![TipTap v3](https://img.shields.io/badge/TipTap%20v3-000000?style=flat-square)
![CodeMirror 6](https://img.shields.io/badge/CodeMirror%206-1B4FFF?style=flat-square)
![Groq AI](https://img.shields.io/badge/Groq%20AI-F55036?style=flat-square)
![Hocuspocus](https://img.shields.io/badge/Hocuspocus%20v4-6366F1?style=flat-square)

<br/>

</div>

---

## What is CoWrite?

CoWrite is a **production-ready, real-time collaborative editor** built from scratch — combining the document power of Google Docs, the code experience of VS Code, and the AI intelligence of Cursor, all in one sleek dark-themed application.

Multiple users can write and code simultaneously, see each other's live cursors, chat in real time, hop on a voice call, and get AI assistance — all without leaving the editor.

Built on **Yjs CRDTs** — the same conflict-free data technology used by Notion, Linear, and Loom — CoWrite guarantees that no matter how many people are editing at the same time, the document always stays consistent.

<br/>

---

## 🚀 Live Demo

**👉 [https://cowrite-tawny.vercel.app](https://cowrite-tawny.vercel.app)**

> Open in two browser tabs, type in one — watch it appear instantly in the other.  
> Share the document URL with a friend and collaborate live across the internet.

<br/>

---

## ✨ Features

### 📝 Rich Text Editor
A full Google Docs-quality editor powered by TipTap v3 and ProseMirror.

| Feature | Details |
|---------|---------|
| Text formatting | Bold, italic, underline, strikethrough, inline code |
| Headings | H1, H2, H3 with visual size difference |
| Lists | Bullet, numbered, and task lists with checkboxes |
| Structure | Blockquotes, horizontal rules, images (by URL) |
| Tables | Insert, add/remove rows & columns, delete — fully styled |
| Links | Insert and remove hyperlinks |
| Colors | Text color picker (10 colors), highlight in 5 colors |
| Alignment | Left, center, right text alignment |
| Bubble menu | Floating toolbar appears on any text selection |
| Export | One-click export to Markdown (`.md`) |
| Word count | Live word + character counter in the status bar |
| Word goal | Set a writing target — progress bar fills as you write |

---

### 💻 Code Editor
A full IDE-quality code editor powered by CodeMirror 6.

| Feature | Details |
|---------|---------|
| Languages | JavaScript, TypeScript, Python, CSS, HTML, Markdown, Plain Text |
| Syntax highlighting | Full language-specific colouring via Lezer |
| Code folding | Collapse/expand sections |
| Search | Built-in Ctrl+F search with match highlighting |
| Bracket matching | Auto-matching brackets and parentheses |
| Indentation | Tab key indents, auto-indent on enter |
| Export | Download with correct file extension (`.js`, `.py`, `.ts`, etc.) |
| Status bar | Live line count + current language display |

---

### 🤝 Real-Time Collaboration
Every change syncs character-by-character with no page refresh.

- **Live cursors** — see every collaborator's cursor, labeled and color-coded
- **Presence bar** — live avatars of everyone in the document with online ping
- **Offline resilience** — edits queue locally and sync when reconnected automatically
- **CRDT merge** — any order of edits always converges to the same result
- **Share link** — one click copies the URL; anyone with the link can join instantly

---

### 🤖 AI Assistant
A Cursor/VS Code-style AI panel embedded in every document and code file.

- Powered by **Groq's Llama 3.1 8B** — the fastest free LLM inference available
- **Context-aware** — sends your document content with every message
- **Quick prompts** — Summarize, Fix bugs, Explain code, Improve writing, Write draft
- **Insert button** — drops AI response text directly into your editor
- Works in both document mode and code mode with different system prompts
- Smart local fallback responses when Groq key is not configured

---

### 💬 Real-Time Team Chat
Talk to collaborators without leaving the document.

- Chat panel slides in from the right edge of the editor
- Messages sync in real time via **Yjs Y.Array** — same CRDT as the document
- Messages persist with the document (not lost on refresh)
- Notification dot on the chat button when a new message arrives
- Colored avatars and timestamps on every message

---

### 📞 Voice Call
Audio collaboration built right into the editor.

- One-click to start a call — browser requests mic permission
- See all participants currently on the call
- **Mute/unmute** your own microphone
- Uses **WebRTC** for peer-to-peer audio
- Presence detection via Yjs Awareness — see who joins/leaves
- End call button cleans up all connections

---

### 🌙 Dark / Light Mode
- Full dark theme (default) — OLED-friendly near-black with glass morphism effects
- Full light theme — clean white with soft shadows and proper contrast
- Toggle with the sun/moon button in header
- Theme preference persists in localStorage
- Applied instantly on page load (no flash)

---

### 📁 Document Management
A Google Docs-style dashboard with everything you need.

- **Left sidebar** — navigation, new document button, file importer, user profile
- **Template gallery** — 5 templates: Blank Doc, Code File, Meeting Notes, Project Plan, API Spec
- **Grid + List view** — switch between visual cards and compact list
- **Sort** — by Last Modified, Date Created, or Name
- **Search** — instant filtering across all documents
- **Star documents** — favourite docs for quick access
- **Document previews** — cards show the first 150 chars of actual content
- **Context menu** — Rename, Star, Delete on every document
- **File import** — open `.md`, `.txt`, `.js`, `.ts`, `.py`, `.css`, `.html` and more

---

### 🔐 Authentication
- Full sign-up / sign-in with email + password
- Password strength meter on registration
- Custom avatar color (10 options)
- Guest mode — use the app without signing up
- Profile settings page — update name and avatar color
- Session persists across browser sessions

---

### 📖 Document Outline Sidebar
- Live outline panel extracted from H1, H2, H3 headings
- Click any heading to jump to it instantly
- Updates in real time as you type
- Document info tab: word count, character count, headings, reading time

<br/>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                         │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────┐  │
│  │  Dashboard  │  │  Rich Text   │  │  Code   │  │ AI Panel │  │
│  │  (Docs list │  │  (TipTap v3) │  │  (CM6)  │  │ (Groq)   │  │
│  │  + Chat +   │  │   + Yjs      │  │  + Yjs  │  │          │  │
│  │   Voice)    │  │   binding    │  │  binding│  │          │  │
│  └─────────────┘  └──────────────┘  └─────────┘  └──────────┘  │
│                              │                                   │
│                    Y.Doc (in-memory CRDT)                        │
│                    Y.Array (chat messages)                       │
│                    Awareness (cursors + voice)                   │
│                              │                                   │
│              HocuspocusProvider (WebSocket client)               │
└──────────────────────────────┼───────────────────────────────────┘
                               │  Single port: WS upgrade + HTTP
┌──────────────────────────────┼───────────────────────────────────┐
│                   Backend (Node.js on Render)                    │
│                                                                  │
│  ┌───────────────────────┐   ┌────────────────────────────────┐  │
│  │  ws.WebSocketServer   │   │       Express REST API         │  │
│  │  → Hocuspocus v4      │   │  GET  /api/documents           │  │
│  │    onLoadDocument     │   │  POST /api/documents           │  │
│  │    onStoreDocument    │   │  PUT  /api/documents/:id       │  │
│  │    (CRDT merge +      │   │  DEL  /api/documents/:id       │  │
│  │     persistence)      │   │  GET  /api/documents/:id/prev  │  │
│  └───────────────────────┘   │  POST /api/ai (Groq proxy)     │  │
│                              │  GET  /health                  │  │
│  storage/docs/*.bin          └────────────────────────────────┘  │
│  storage/metadata.json                                           │
└──────────────────────────────────────────────────────────────────┘
```

### How CRDTs make real-time collaboration work

The core challenge: two users type at the same position simultaneously. A naive system would corrupt the document or silently drop one edit.

**Yjs solves this with Conflict-free Replicated Data Types:**

1. Every keystroke → a tiny Yjs binary diff (a few bytes)
2. Provider sends the diff to Hocuspocus server instantly
3. Server broadcasts to all connected peers
4. Each client applies the diff to its local `Y.Doc`
5. **Guarantee: any two states merged in any order = identical result**

Offline? Your edits queue locally. Reconnect? They sync perfectly. No "last write wins". No data loss. Ever.

**The chat** uses `Y.Array` on the same document — messages are CRDT-merged just like text, so chat history is always consistent across all clients.

**Cursors and voice call presence** use the Yjs Awareness protocol — a lightweight JSON broadcast that piggybacks on the same WebSocket at ~50ms latency.

<br/>

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 16** App Router | Full-stack React, zero-config Vercel deploy |
| Language | **TypeScript** end-to-end | Type safety throughout |
| Styling | **Tailwind CSS v4** + CSS variables | Utility-first + design tokens |
| Rich text | **TipTap v3** + ProseMirror | Best Yjs-native document editor |
| Code editor | **CodeMirror 6** | Pure JS, no native modules, official Yjs binding |
| CRDT engine | **Yjs** | Industry standard, offline-first, battle-tested |
| WS server | **Hocuspocus v4** | Yjs-native WebSocket server |
| WS client | **@hocuspocus/provider v4** | Auto-reconnect, awareness, sync |
| AI | **Groq API** (Llama 3.1 8B) | Fastest free LLM inference available |
| Voice | **WebRTC** getUserMedia | Native browser P2P audio, no server relay |
| Auth | **localStorage** session | Zero-dependency, instantly deployable |
| Persistence | **Filesystem** (Yjs binary) | No database required |
| Icons | **Lucide React** | Consistent, lightweight icon set |
| Frontend host | **Vercel** | Zero-config Next.js, instant CDN |
| Backend host | **Render** | Free Node.js with persistent WebSocket |

<br/>

---

## 📂 Project Structure

```
cowrite/
├── backend/
│   ├── src/
│   │   └── server.ts          # Everything: Hocuspocus + Express + AI + preview
│   ├── .env.example           # Environment variable reference
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Dashboard — Google Docs-style, templates, search
│   │   ├── layout.tsx         # Root layout with instant theme init
│   │   ├── globals.css        # Design system — dark + light themes
│   │   ├── auth/
│   │   │   ├── signin/        # Sign in page
│   │   │   └── signup/        # Sign up with password strength meter
│   │   ├── doc/[id]/          # Editor — richtext or code, all panels
│   │   └── settings/          # Profile settings
│   │
│   ├── components/
│   │   ├── RichTextEditor.tsx # TipTap + Yjs + bubble menu + all formatting
│   │   ├── CodeEditor.tsx     # CodeMirror 6 + yCollab + 7 languages + search
│   │   ├── AIPanel.tsx        # Groq AI chat (Cursor-style)
│   │   ├── ChatPanel.tsx      # Real-time team chat via Yjs Y.Array
│   │   ├── VoiceCall.tsx      # WebRTC voice call with participant list
│   │   ├── DocSidebar.tsx     # Document outline + word count + reading time
│   │   ├── PresenceBar.tsx    # Live user avatars + connection status
│   │   ├── ShareModal.tsx     # Share link with feature badges
│   │   ├── ThemeToggle.tsx    # Dark/light mode toggle button
│   │   └── UserNameModal.tsx  # First-visit name + color picker
│   │
│   ├── lib/
│   │   ├── yjs-provider.ts    # Hocuspocus provider + all REST API helpers
│   │   ├── auth.ts            # Sign up / sign in / session management
│   │   ├── ai.ts              # Groq client + smart fallbacks
│   │   └── theme.ts           # Dark/light theme management
│   │
│   ├── public/
│   │   └── logo.svg           # CoWrite brand logo
│   │
│   └── vercel.json            # Vercel deployment config
│
├── render.yaml                # Render deployment config
└── README.md
```

<br/>

---

## ⚡ Local Development

### Prerequisites
- **Node.js 20+** (`node --version`)
- **Not inside a OneDrive folder** — causes file lock issues on Windows

### 1. Clone
```bash
git clone https://github.com/Eddiegah/cowrite.git
cd cowrite
```

### 2. Start the backend
```bash
cd backend
npm install
npm run dev
```
Expected output:
```
✅ CoWrite server running on port 3001
   REST → http://0.0.0.0:3001/api
   WS   → ws://0.0.0.0:3001
   AI   → Smart fallback (set GROQ_API_KEY for Groq)
```

### 3. Start the frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open **http://localhost:3000**

### 4. Test real-time sync
1. Open **http://localhost:3000** in two browser windows
2. Sign up (or continue as guest)
3. Create a document → copy the URL → open in second window
4. Type in one window → appears instantly in the other ✅
5. Click **AI** to open the assistant ✅
6. Click the chat bubble to open team chat ✅
7. Click the phone icon to start a voice call ✅

<br/>

---

## 🔐 Environment Variables

### Backend — `backend/.env`
```env
PORT=3001
GROQ_API_KEY=gsk_xxxxxxxxxxxx   # Free at console.groq.com — enables Llama 3.1 AI
FRONTEND_URL=*                  # Set to your Vercel URL in production
STORAGE_DIR=                    # Leave blank to use ./storage locally
```

### Frontend — `frontend/.env.local`
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

<br/>

---

## 🚢 Deployment

### Backend → Render

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| PORT | `10000` |

Add in Render Environment Variables:
```
PORT          = 10000
GROQ_API_KEY  = gsk_xxxx          # From console.groq.com
FRONTEND_URL  = https://cowrite-tawny.vercel.app
```

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Install Command | `npm install --legacy-peer-deps` |
| Framework | Next.js (auto-detected) |

Add in Vercel Environment Variables:
```
NEXT_PUBLIC_WS_URL  = wss://cowrite-backend-2nv1.onrender.com
NEXT_PUBLIC_API_URL = https://cowrite-backend-2nv1.onrender.com
```

### Enable Real AI (free, 1 minute)
1. Visit **https://console.groq.com** → sign up
2. **API Keys** → **Create API Key** → copy
3. Add to Render: `GROQ_API_KEY = gsk_xxxx`
4. Render redeploys automatically — AI upgrades to **Llama 3.1 8B**

> **Note on Render free tier:** The server sleeps after 15 min of inactivity. First load after sleep shows a "Waking up server…" message (takes ~30 seconds). Subsequent loads are instant. Upgrade to Render's $7/month plan for always-on.

<br/>

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Search (code editor) |
| `Tab` | Indent (code editor) |
| `Enter` | Send AI / chat message |
| `Shift+Enter` | New line in AI / chat |
| Click doc title | Inline rename |
| Click sun/moon | Toggle dark/light mode |

<br/>

---

## 🗺️ Roadmap

The foundation is solid. Here's what's coming next:

- [ ] **Document version history** — named snapshots, one-click rollback
- [ ] **Comments** — inline annotations anchored to text positions
- [ ] **Google sign-in** — OAuth 2.0 with real account management
- [ ] **Document permissions** — view-only vs. edit access per collaborator
- [ ] **PDF / DOCX export** — beyond Markdown
- [ ] **Image upload** — drag-and-drop images (not just URLs)
- [ ] **Mobile UI** — responsive layout for phones and tablets
- [ ] **Mention notifications** — `@name` alerts collaborators
- [ ] **Document templates marketplace** — community-shared templates

<br/>

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss.

```bash
git clone https://github.com/Eddiegah/cowrite.git
git checkout -b feature/your-feature
# make your changes
git commit -m "feat: your feature"
git push origin feature/your-feature
# open a Pull Request
```

<br/>

---

## 📄 License

MIT © 2026 [Eddiegah](https://github.com/Eddiegah)

<br/>

---

<div align="center">

Built with Yjs · TipTap · CodeMirror · Hocuspocus · Groq · Next.js

**[Live Demo](https://cowrite-tawny.vercel.app) · [Report Bug](https://github.com/Eddiegah/cowrite/issues) · [Request Feature](https://github.com/Eddiegah/cowrite/issues)**

<br/>

*CoWrite — Write together, build together, in real time.*

</div>
