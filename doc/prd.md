# 📘 **Product Requirements Document (PRD)**

### **Project Codename: “ArcNote”**

### A Block-based Markdown Note App — Web First, Android PWA

---

# 1. **Purpose & Vision**

ArcNote adalah aplikasi pencatatan **block-based** seperti Notion namun versi ringan, cepat, dan offline-first. ArcNote dirancang untuk pengguna personal yang ingin menulis catatan dengan struktur fleksibel berbasis block, dan bisa digunakan baik di **Web** maupun **Android (via PWA)** tanpa backend.

Vision:

> _“A fast, offline-first, personal block-based note-taking app that works everywhere, with zero backend dependencies.”_

---

# 2. **Project Scope (Fokus Awal/MVP)**

Fokus MVP ArcNote:

### ✔ Web App (React + Tiptap)

### ✔ Android melalui PWA (installable, offline)

### ✔ Block-based editor

Paragraph, heading, bullet list, numbered list, todo, quote, divider.

### ✔ Slash command `/` minimal

### ✔ Penyimpanan lokal (IndexedDB)

### ❌ Tidak ada login

### ❌ Tidak ada sync

### ❌ Tidak ada kolaborasi

### ❌ Tidak ada file upload

### ❌ Tidak ada cloud

Goal MVP:

> User dapat membuat page, menambah block, mengedit block, dan menyimpan semuanya secara offline secara persisten.

---

# 3. **Future Scope (Tahapan Jangka Panjang)**

## Phase 2:

- Cloud sync via Supabase
- Auth login
- Backup/restore

## Phase 3:

- APK Android via Capacitor
- Local export/import file `.json`

## Phase 4:

- More block types (toggle, callout, table)
- Tagging
- Templates

## Phase 5:

- CRDT
- Real-time collaboration
- Desktop App (Electron/Tauri)

---

# 4. **Core Product Requirements (MVP)**

## 4.1 Pages

- View list pages
- Create page
- Delete page
- Rename page
- Timestamp created/updated
- Stored in IndexedDB

## 4.2 Page Editor (Block-based)

Block types:

- Paragraph
- Heading (1–3)
- Bullet list
- Numbered list
- Todo checkbox
- Quote
- Divider

Key interactions:

- Enter → block baru
- Backspace di awal block → merge
- Slash command → pilih block type
- Keyboard shortcuts (Ctrl+B/I/U)

## 4.3 Data Persistence

- IndexedDB via Dexie
- Auto save (debounce 300–600ms)
- Full offline persistence

## 4.4 PWA (Android)

- Installable
- Fullscreen
- Offline
- Cache static assets + DB
- Icon + splash screen ArcNote

---

# 5. **Non-functional Requirements**

### Performance

- Editor responsif
- Rendering block teroptimasi (memoization)

### Reliability

- Data tidak boleh hilang
- IndexedDB write harus aman

### UX

- Minimalis
- Fokus ke writing experience

---

# 6. **Tech Stack**

Frontend:

- React
- TypeScript
- Tiptap
- TailwindCSS

Storage:

- Dexie.js (IndexedDB)

Platforms:

- Web
- Android via PWA

Architecture Principles:

- Local-first
- Modular blocks
- Clean storage layer
- Clear state separation

---

# 7. **Architecture Diagram (MVP)**

```
UI (React) ──► Editor Engine (Tiptap)
     │                │
     ▼                ▼
 App State (Zustand)
     │
     ▼
IndexedDB (Dexie)
     │
     ▼
PWA Layer (Service Worker)
```

---

# 8. **Directory Structure (Best Practice)**

```
/src
│
├── app/
│   ├── index.tsx
│   ├── routes/
│
├── components/
│   ├── layout/
│   ├── pages/
│   ├── editor/
│
├── editor/
│   ├── schema/
│   ├── extensions/
│   ├── commands/
│   ├── utils/
│
├── state/
│   ├── pages.store.ts
│   ├── blocks.store.ts
│
├── data/
│   ├── db.ts
│   ├── pages.repository.ts
│   ├── blocks.repository.ts
│
├── types/
│   ├── page.ts
│   ├── block.ts
│
├── utils/
│   ├── debounce.ts
│   ├── id.ts
│
├── pwa/
│   ├── service-worker.ts
│   ├── manifest.json
│
├── styles/
│   ├── globals.css
│   ├── editor.css
│
└── index.html
```

---

# 9. **Development Roadmap (Fokus Awal)**

### Week 1 — Foundation

- Setup project (Vite + React + TS)
- Tailwind
- Page list UI
- CRUD pages (local memory)
- Integrasi Dexie & IndexedDB

### Week 2 — Editor

- Tiptap setup
- Paragraph + Heading
- List & Todo
- Slash command
- Formatting dasar

### Week 3 — Persistence & UX

- Auto-save DB
- Load blocks/page
- Basic UX polishing

### Week 4 — PWA

- Service worker
- Manifest ArcNote
- Installable Android
- Offline caching

---

# 10. **Statement of Focus**

> **Fokus versi pertama ArcNote hanya pada:**
>
> - Web app
> - Block editor dasar
> - Local storage
> - PWA Android

> **Tidak mengerjakan:**
>
> - Backend
> - Sync
> - Native Android
> - Feature kompleks
> - Collaboration

Ini penting supaya ArcNote MVP dapat selesai dan usable.

---
