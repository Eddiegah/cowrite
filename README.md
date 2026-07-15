# CoWrite — Real-Time Collaborative Editor

A from-scratch demonstration of real-time collaborative editing architecture: CRDTs, WebSocket sync, and live presence. Supports rich text and code editing with character-by-character sync between any number of connected users.

---

## What it does

- **Real-time collaboration**: Multiple users editing the same document see each other's changes live, character by character, with no page refresh.
- **Two editor modes**: Rich text (TipTap — bold, italic, headings, lists, blockquotes) or code (CodeMirror 6 — syntax highlighting for JS/TS/Python/plain text).
- **Live cursors & presence**: Each connected user's cursor is shown in real time, labeled with their name and a distinct color.
- **Offline resilience**: If your connection drops, your local edits queue and sync automatically when you reconnect. No data loss, no manual refresh.
- **Export**: Rich text → Markdown. Code → file with correct extension.
- **Document dashboard**: Create, rename, delete documents. Each gets a unique shareable URL.

---

## How the sync works (plain language)

The core sync engine is **Yjs**, a CRDT (Conflict-free Replicated Data Type) library.

**The problem it solves**: If two users simultaneously type "Hello" and "World" at the same position in a document, a naive approach would either overwrite one person's edit or corrupt the document. CRDTs solve this by encoding every change as an operation that can be merged with any other operation in any order and always produce the same result.

**The pipeline**:
1. When you type, TipTap (or CodeMirror) produces a Yjs "update" — a tiny binary diff describing exactly what changed.
2. The update goes to the Hocuspocus WebSocket server via your browser's WebSocket connection.
3. The server broadcasts it to every other connected client.
4. Each client's Yjs doc applies the update and re-renders. Since Yjs operations are commutative and idempotent, the merge is always consistent — even if updates arrive out of order.
5. The full document state is also persisted to disk after every change, so it survives server restarts.

**Offline resilience**: Yjs stores pending updates in memory while the WebSocket is disconnected. When reconnected, it sends all queued updates and merges any changes that happened remotely while you were offline.

**Presence/cursors**: The Yjs Awareness protocol runs on the same WebSocket. Each client broadcasts JSON state (name, color, cursor position) to all peers in near-real-time. The presence bar and cursor overlays render this.

---

## Project structure

```
cowrite/
├── frontend/                      # Next.js 16 (App Router) + TipTap + CodeMirror
│   ├── app/
│   │   ├── page.tsx               # Document dashboard
│   │   └── doc/[id]/page.tsx      # Editor page (mode-aware)
│   ├── components/
│   │   ├── RichTextEditor.tsx     # TipTap + Yjs binding
│   │   ├── CodeEditor.tsx         # CodeMirror 6 + Yjs binding
│   │   ├── PresenceBar.tsx        # Live user presence display
│   │   ├── DocumentCard.tsx       # Dashboard card with rename/delete
│   │   └── UserNameModal.tsx      # First-visit name/color picker
│   ├── lib/
│   │   └── yjs-provider.ts        # Hocuspocus provider setup + API helpers
│   └── .env.local                 # WS and API URLs (gitignored)
├── backend/                       # Hocuspocus + Express REST API
│   ├── src/server.ts              # All backend logic
│   └── storage/                   # Document files (gitignored)
├── .gitignore
└── README.md
```

---

## Setup (local development)

### Requirements

- **Node.js 20 LTS or later** — check with `node --version`
- **Not in a OneDrive folder** — OneDrive sync causes file-lock issues with node_modules on Windows. Use a path like `C:\Projects\cowrite`.

### Install & run

**Backend (Hocuspocus sync server):**
```
cd backend
npm install
npm run dev
```
You should see:
```
Hocuspocus v2.x running at:
  > WebSocket: ws://0.0.0.0:1234
[CoWrite] ✅ REST API server running on http://localhost:1235
```

**Frontend (Next.js):**
```
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open http://localhost:3000.

### Verify sync

1. Open http://localhost:3000 in two browser windows (or tabs).
2. Create a document in one window.
3. Copy the URL and open it in the second window.
4. Type in one window — you should see the text appear in the other in real time.

If sync doesn't work, check:
- Backend logs show the WebSocket connection
- `NEXT_PUBLIC_WS_URL` in `frontend/.env.local` points to `ws://localhost:1234`

---

## Deployment

### Overview

- **Backend**: Deploy to Render (free tier) as a Node.js web service.
- **Frontend**: Deploy to Vercel.
- Connect them via environment variables.

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial CoWrite build"
git remote add origin https://github.com/YOUR_USERNAME/cowrite.git
git push -u origin main
```

### Step 2: Deploy backend to Render

1. Go to [render.com](https://render.com) and create a new **Web Service**.
2. Connect your GitHub repo.
3. Set these values:
   - **Root directory**: `backend`
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm start`
   - **Environment variables**:
     - `PORT` = `10000` (Render's default)
     - `API_PORT` = `10001`
     - `FRONTEND_URL` = your Vercel deployment URL (add this after deploying frontend)
4. Deploy. Copy the deployed URL — it will look like `https://cowrite-backend.onrender.com`.

> **Note**: Render free tier spins down services after ~15 minutes of inactivity. The first WebSocket connection after a period of inactivity may take 30–60 seconds while the service wakes up. This is a known free-tier limitation, not a bug. The client will reconnect automatically.

### Step 3: Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo.
2. Set **Root directory** to `frontend`.
3. Add environment variables:
   - `NEXT_PUBLIC_WS_URL` = `wss://cowrite-backend.onrender.com` (use `wss://` not `ws://` in production)
   - `NEXT_PUBLIC_API_URL` = `https://cowrite-backend.onrender.com`
4. Deploy.

### Step 4: Verify production sync

1. Open your Vercel URL in two different devices or browsers.
2. Create a document and share the URL.
3. Type in one browser — the other should sync in real time.

---

## Troubleshooting

**"Could not connect to the CoWrite backend" on the dashboard**
- Make sure the backend is running (`npm run dev` in `backend/`)
- Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:1235`
- Check the backend REST API port (default 1235): `curl http://localhost:1235/health`

**Changes not syncing between browser tabs**
- Check the browser console for WebSocket errors
- Make sure `NEXT_PUBLIC_WS_URL=ws://localhost:1234` in `.env.local`
- Check Hocuspocus server logs for incoming connections

**`npm install` fails with node-gyp errors**
- This shouldn't happen with CoWrite's dependencies (no native modules).
- If you see this, check which package triggered it and open an issue.

**npm install fails with peer dependency conflicts**
- Run with `--legacy-peer-deps`: `npm install --legacy-peer-deps`
- This is expected with TipTap v3's transitional peer deps

**Editor flashes / content disappears on load**
- The editor waits for the initial sync event before becoming visible. If the backend is down, it will stay in loading state. Start the backend.

---

## What's not in v1 (future work)

- **User authentication / access control**: Right now, anyone with the URL can edit. Adding real accounts, roles, and per-document permissions is the natural next step.
- **Document version history / rollback**: Yjs natively supports this via `Y.UndoManager` with snapshots — it's architecturally straightforward but out of scope here.
- **Mobile-optimized UI**: The layout is responsive on laptops; proper mobile support (touch toolbars, virtual keyboard handling) is a stretch goal.
- **Mode switching mid-document**: Switching a document between rich-text and code mode after creation would require a content migration step (ProseMirror XML → plain text → CodeMirror). Not included in v1.
- **Comments / annotations**: Yjs supports relative positions for anchored annotations — a solid future feature.

---

## Tech stack

| Layer | Library | Why |
|---|---|---|
| Frontend framework | Next.js 16 (App Router) | Full-stack React with easy deployment |
| Styling | Tailwind CSS | Utility-first, fast to iterate |
| Rich text editor | TipTap v3 | Best ProseMirror wrapper with first-class Yjs support |
| Code editor | CodeMirror 6 | Pure JS, no native modules, official Yjs binding |
| CRDT sync engine | Yjs | Industry-standard CRDT for collaborative text |
| WebSocket server | Hocuspocus | Yjs-native WebSocket server with built-in persistence hooks |
| Frontend WS provider | @hocuspocus/provider | Official Hocuspocus client with auto-reconnect |
| Persistence | Filesystem (binary Yjs state) | No database dependency for v1 |
| Presence | Yjs Awareness protocol | Built into Yjs, runs on the same WebSocket |
