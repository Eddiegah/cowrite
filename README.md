<div align="center">

<img src="frontend/public/logo.svg" width="80" height="80" alt="CoWrite Logo" />

# CoWrite

### Real-time collaborative documents and code — with built-in AI

**Write together. Build together. In real time.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-cowrite--tawny.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://cowrite-tawny.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://cowrite-backend-2nv1.onrender.com/health)
[![GitHub](https://img.shields.io/badge/GitHub-Eddiegah%2Fcowrite-181717?style=for-the-badge&logo=github)](https://github.com/Eddiegah/cowrite)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Yjs](https://img.shields.io/badge/Yjs%20CRDTs-F6821F?style=flat-square)
![TipTap](https://img.shields.io/badge/TipTap%20v3-000000?style=flat-square)
![CodeMirror](https://img.shields.io/badge/CodeMirror%206-1B4FFF?style=flat-square)
![Groq](https://img.shields.io/badge/Groq%20AI-F55036?style=flat-square)

</div>

---

## What is CoWrite?

CoWrite is a **production-grade, real-time collaborative editor** that combines the best of Google Docs and VS Code — in a single, beautifully designed application. Multiple users can write and code simultaneously, seeing each other's cursors live, with zero lag and zero conflicts.

Built from scratch on **Yjs CRDTs** — the same technology powering Linear, Loom, and Notion — CoWrite demonstrates that true real-time collaboration is achievable without a massive engineering team.

---

## Live Demo

🌐 **https://cowrite-tawny.vercel.app**

Open in two different browser tabs or share with a friend. Type in one — watch it appear instantly in the other.

---

## Features

### ✍️ Rich Text Editor
- Full document editor powered by **TipTap v3 + ProseMirror**
- Bold, italic, underline, strikethrough, inline code
- Headings H1–H3, bullet lists, numbered lists, task lists with checkboxes
- Blockquotes, tables (insert/add rows/columns/delete), images, horizontal rules
- Text color picker (10 colors), highlight (5 colors), text alignment
- Link insertion and removal
- **Floating bubble menu** — appears on any text selection for instant formatting
- Export as Markdown (`.md`)

### 💻 Code Editor
- Full IDE-quality editor powered by **CodeMirror 6**
- 7 languages: JavaScript, TypeScript, Python, CSS, HTML, Markdown, Plain Text
- Syntax highlighting, code folding, bracket matching, active line highlight
- **Built-in search** (Ctrl+F) with match highlighting
- Full keyboard shortcuts (undo/redo, indent with Tab)
- Line count status bar
- Export with correct file extension

### 🤝 Real-Time Collaboration
- Character-by-character sync with **no page refresh needed**
- **Live cursors** — every user's cursor shown in real time, labeled and color-coded
- **Presence bar** — avatars of everyone in the document, with online ping indicator
- **Offline resilience** — edits queue locally, sync automatically on reconnect
- CRDT-based conflict resolution — any order of edits always converges correctly
- Shareable document links — one click, anyone can join

### 🤖 AI Assistant (Cursor/VSCode-style)
- Embedded AI panel in every document and code file
- Powered by **Groq's Llama 3.1 8B** (fastest inference available, free tier)
- Context-aware: sends your document content with every message
- Quick prompts: Summarize, Fix bugs, Explain, Improve, Write draft
- **Insert button** on AI responses — drops text directly into the editor
- Works in both doc mode and code mode with mode-specific system prompts
- Smart local fallbacks when no API key configured — always functional

### 🔐 Authentication
- Full sign-up / sign-in flow with email + password
- Password strength meter during registration
- Avatar with custom color (10 color options)
- Profile settings page — update name and color
- Guest mode — try without signing up
- Session persistence via localStorage

### 📁 Document Management
- **Google Docs-style dashboard** — left sidebar navigation, template gallery
- 5 templates: Blank Doc, Code File, Meeting Notes, Project Plan, API Spec
- Grid and list view modes
- Sort by Last Modified, Date Created, Name
- Search across all documents
- Star/favourite documents
- Rename, delete, duplicate documents
- **File import** — open `.md`, `.txt`, `.js`, `.ts`, `.py`, `.css`, `.html`, `.rs`, `.go` files from disk

### 📖 Document Outline Sidebar
- Live outline extracted from H1/H2/H3 headings
- Click any heading to scroll to it instantly
- Document stats: word count, character count, headings, paragraphs, reading time

### 🎨 Design
- Apple-grade dark UI — glass morphism, subtle gradients, micro-animations
- Custom CoWrite logo and brand identity
- Consistent design system with CSS custom properties
- Smooth transitions on every interactive element
- Custom scrollbars, tooltips, focus rings
- Fully responsive layout

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | **Next.js 16** (App Router) | Full-stack React, optimal deployment |
| Language | **TypeScript** throughout | Type safety end to end |
| Styling | **Tailwind CSS v4** + CSS variables | Utility-first + design tokens |
| Rich text editor | **TipTap v3** | Best ProseMirror wrapper, native Yjs support |
| Code editor | **CodeMirror 6** | Pure JS, no native modules, official Yjs binding |
| CRDT sync engine | **Yjs** | Industry-standard CRDT, offline-first |
| WebSocket server | **Hocuspocus v4** | Yjs-native WebSocket server |
| WS provider | **@hocuspocus/provider v4** | Official client with auto-reconnect |
| AI inference | **Groq API** (Llama 3.1 8B) | Fastest free LLM inference available |
| Auth | **localStorage** (client-side) | Zero-dependency, demo-ready |
| Persistence | **Filesystem** (Yjs binary state) | No database required |
| Presence | **Yjs Awareness protocol** | Runs on same WebSocket |
| Frontend hosting | **Vercel** | Zero-config Next.js deployment |
| Backend hosting | **Render** | Free-tier Node.js with persistent socket |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│                                                          │
│  Next.js App Router                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Dashboard    │  │ Rich Text    │  │ Code Editor  │   │
│  │ (Google Docs │  │ (TipTap v3 + │  │ (CodeMirror  │   │
│  │  style)      │  │  Yjs binding)│  │  6 + yCollab)│   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                           │                              │
│                    Yjs Y.Doc (in-memory CRDT)            │
│                           │                              │
│           HocuspocusProvider (WebSocket client)          │
└───────────────────────────┼──────────────────────────────┘
                            │  WebSocket (ws://)
                            │  + HTTP REST (https://)
┌───────────────────────────┼──────────────────────────────┐
│                    Backend (Render)                      │
│                                                          │
│   Node.js HTTP Server (single port)                      │
│   ┌──────────────────────┐  ┌────────────────────────┐   │
│   │ ws.WebSocketServer   │  │ Express REST API       │   │
│   │ → Hocuspocus v4      │  │ /api/documents CRUD    │   │
│   │   (CRDT merge +      │  │ /api/ai (Groq proxy)   │   │
│   │    persistence)      │  │ /health                │   │
│   └──────────────────────┘  └────────────────────────┘   │
│                │                                         │
│         storage/docs/*.bin  (Yjs binary state)           │
│         storage/metadata.json (doc index)                │
└──────────────────────────────────────────────────────────┘
```

### How CRDTs solve real-time collaboration

The core problem: if two users type at the same position simultaneously, a naive system would corrupt the document or silently drop one user's edit.

**Yjs CRDTs solve this by making every operation commutative and idempotent:**

1. Every keystroke produces a tiny Yjs "update" — a binary diff
2. The provider sends it to the Hocuspocus server
3. Server broadcasts to all connected peers
4. Each client applies the update to its local Y.Doc
5. Yjs guarantees: **any two states merged in any order produce the same result**

This means offline edits queue up and sync perfectly when reconnected. No "last write wins", no conflicts, no data loss.

**Awareness protocol** (cursors, presence) runs on the same WebSocket, piggybacks the sync channel, and broadcasts user state (name, color, cursor position) at ~50ms latency.

---

## Local Development

### Prerequisites
- Node.js 20 LTS or later
- **Not in a OneDrive folder** — causes file-lock issues on Windows

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/Eddiegah/cowrite.git
cd cowrite
```

**2. Start the backend**
```bash
cd backend
npm install
npm run dev
```
You should see:
```
✅ CoWrite server running on port 3001
   REST → http://0.0.0.0:3001/api
   WS   → ws://0.0.0.0:3001
```

**3. Start the frontend**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open **http://localhost:3000**

**4. Verify sync**
- Open http://localhost:3000 in two browser windows
- Sign up (or continue as guest)
- Create a document → share the URL to the second window
- Type in one window → appears in the other instantly ✅

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=3001
GROQ_API_KEY=gsk_xxxx        # Get free at console.groq.com
FRONTEND_URL=*               # Set to your Vercel URL in production
STORAGE_DIR=                 # Leave blank for ./storage (local dev)
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Deployment

### Backend → Render

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| PORT | `10000` |

**Required env vars on Render:**
- `PORT` = `10000`
- `GROQ_API_KEY` = your Groq key
- `FRONTEND_URL` = your Vercel domain

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Install Command | `npm install --legacy-peer-deps` |
| Framework | Next.js (auto-detected) |

**Required env vars on Vercel:**
- `NEXT_PUBLIC_WS_URL` = `wss://your-backend.onrender.com`
- `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com`

### Enable real AI (Groq)
1. Go to **https://console.groq.com** → sign up free
2. **API Keys** → **Create API Key** → copy
3. Add to Render: `GROQ_API_KEY` = your key
4. Render redeploys automatically — AI is now powered by **Llama 3.1 8B**

> **Note:** Render free tier sleeps after 15 min of inactivity. First request after sleep takes ~30 seconds. This is a known free-tier limitation, not a bug.

---

## Project Structure

```
cowrite/
├── backend/
│   ├── src/
│   │   └── server.ts          # Single-file backend: Hocuspocus + Express + AI
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Dashboard (Google Docs-style)
│   │   ├── auth/
│   │   │   ├── signin/        # Sign in page
│   │   │   └── signup/        # Sign up page
│   │   ├── doc/[id]/          # Editor page (rich text + code)
│   │   └── settings/          # Profile settings
│   ├── components/
│   │   ├── RichTextEditor.tsx # TipTap + Yjs + bubble menu + all formatting
│   │   ├── CodeEditor.tsx     # CodeMirror 6 + yCollab + 7 languages
│   │   ├── AIPanel.tsx        # Groq AI chat panel (Cursor-style)
│   │   ├── DocSidebar.tsx     # Document outline + word count
│   │   ├── PresenceBar.tsx    # Live user avatars + connection status
│   │   ├── ShareModal.tsx     # Share link modal
│   │   └── UserNameModal.tsx  # First-visit name + color picker
│   ├── lib/
│   │   ├── yjs-provider.ts    # Hocuspocus provider + REST API helpers
│   │   ├── auth.ts            # Auth system (localStorage-based)
│   │   └── ai.ts              # Groq AI client + smart fallbacks
│   └── public/
│       └── logo.svg           # CoWrite brand logo
│
├── render.yaml                # Render deployment config
└── README.md
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Search (code editor) |
| `Tab` | Indent (code editor) |
| `Enter` | Send AI message |
| `Shift+Enter` | New line in AI chat |
| Click doc title | Inline rename |

---

## Roadmap

- [ ] Real database (PostgreSQL) for user accounts and document ownership
- [ ] Document permissions — view-only vs edit access
- [ ] Version history with named snapshots (rollback support)
- [ ] Comments and annotations anchored to text positions
- [ ] Document sharing with granular access control
- [ ] Mobile-optimized UI
- [ ] Markdown import into rich text
- [ ] Image upload (not just URL)
- [ ] Real-time commenting sidebar
- [ ] Export to PDF and DOCX

---

## Contributing

Pull requests welcome. For major changes please open an issue first.

```bash
git clone https://github.com/Eddiegah/cowrite.git
cd cowrite
# Make your changes
git checkout -b feature/your-feature
git commit -m "feat: your feature"
git push origin feature/your-feature
# Open a PR on GitHub
```

---

## License

MIT © 2026 [Eddiegah](https://github.com/Eddiegah)

---

<div align="center">

**Built with ❤️ using Yjs, TipTap, CodeMirror, Hocuspocus, and Groq**

[Live Demo](https://cowrite-tawny.vercel.app) · [Report a Bug](https://github.com/Eddiegah/cowrite/issues) · [Request a Feature](https://github.com/Eddiegah/cowrite/issues)

</div>
