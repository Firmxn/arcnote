# Setup & Instalasi ArcNote

## ✅ Tech Stack yang Sudah Terinstall

### Core Framework
- ✅ **Vite** 7.3.1 - Build tool
- ✅ **React** 18.2.0 - UI framework
- ✅ **TypeScript** 5.9.3 - Type safety
- ✅ **@vitejs/plugin-react-swc** 4.2.2 - Fast refresh dengan SWC

### Styling
- ✅ **@tailwindcss/vite** 4.1.18 - Tailwind CSS v4 plugin

### Editor
- ✅ **@tiptap/react** 3.15.3
- ✅ **@tiptap/core** 3.15.3
- ✅ **@tiptap/pm** 3.15.3
- ✅ **@tiptap/starter-kit** 3.15.3

### Data & State
- ✅ **dexie** 4.2.1 - IndexedDB wrapper
- ✅ **dexie-react-hooks** 4.2.0 - React hooks untuk Dexie
- ✅ **zustand** 5.0.9 - State management

### PWA
- ✅ **vite-plugin-pwa** 1.0.0 - PWA support

### Utilities
- ✅ **nanoid** 5.1.6 - ID generator
- ✅ **dayjs** 1.11.19 - Date/time utility
- ✅ **clsx** 2.1.1 - Conditional className helper

---

## 📁 Struktur Direktori

Struktur direktori telah dibuat sesuai dengan `doc/prd.md`:

```
src/
├── app/
│   ├── index.tsx              # Entry point aplikasi
│   └── routes/
│       └── index.ts           # Routes configuration
│
├── components/
│   ├── layout/
│   │   └── MainLayout.tsx     # Layout utama
│   ├── pages/
│   │   └── PagesList.tsx      # Component daftar pages
│   └── editor/
│       └── BlockEditor.tsx    # Block editor component
│
├── editor/
│   ├── schema/
│   │   └── index.ts           # Tiptap schema definitions
│   ├── extensions/
│   │   └── index.ts           # Custom Tiptap extensions
│   ├── commands/
│   │   └── index.ts           # Slash commands
│   └── utils/
│       └── index.ts           # Editor utilities
│
├── state/
│   ├── pages.store.ts         # Zustand store untuk Pages
│   └── blocks.store.ts        # Zustand store untuk Blocks
│
├── data/
│   ├── db.ts                  # Dexie database configuration
│   ├── pages.repository.ts    # Pages data access layer
│   └── blocks.repository.ts   # Blocks data access layer
│
├── types/
│   ├── page.ts                # Page type definitions
│   └── block.ts               # Block type definitions
│
├── utils/
│   ├── debounce.ts            # Debounce utility
│   └── id.ts                  # ID generation utilities
│
├── pwa/
│   └── service-worker.ts      # PWA service worker (placeholder)
│
└── styles/
    ├── globals.css            # Global styles + Tailwind import
    └── editor.css             # Tiptap editor styles
```

### **File-file Penting:**

#### **Data Layer**
- `src/data/db.ts`: Konfigurasi Dexie dengan tabel `pages` dan `blocks`
- `src/data/*.repository.ts`: Repository pattern untuk CRUD operations

#### **State Management**
- `src/state/*.store.ts`: Zustand stores dengan actions untuk Pages dan Blocks

#### **Type Safety**
- `src/types/*.ts`: TypeScript interfaces untuk Page dan Block entities

#### **Components**
- `src/components/`: React components (Layout, Pages, Editor)

#### **Utilities**
- `src/utils/`: Helper functions (debounce untuk auto-save, ID generation)

---

## ⚙️ Konfigurasi

### Vite Config (`vite.config.ts`)
- ✅ Plugin React dengan SWC
- ✅ Plugin Tailwind CSS v4
- ✅ Plugin PWA dengan manifest dasar

### Tailwind CSS (`src/styles/globals.css`)
- ✅ Import Tailwind CSS v4: `@import "tailwindcss";`
- ✅ Base styles dengan dark mode support

---

## 🚀 Cara Menjalankan

```bash
# Development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📝 Catatan

- Node.js version: 22.11.0 (memenuhi requirement ≥ 20.19.0)
- Semua dependencies sudah terinstall dan siap digunakan
- Project structure mengikuti best practice dari `doc/prd.md`
- Tailwind CSS v4 sudah dikonfigurasi via Vite plugin (tidak perlu `tailwind.config.js`)

---

## 🎯 Next Steps

Sesuai roadmap di `doc/prd.md`:
1. ✅ Setup project (Vite + React + TS) - **DONE**
2. ✅ Tailwind - **DONE**
3. ✅ Google Authentication (Supabase) - **DONE**
4. ⏳ Page list UI
5. ⏳ CRUD pages (local memory)
6. ⏳ Integrasi Dexie & IndexedDB
