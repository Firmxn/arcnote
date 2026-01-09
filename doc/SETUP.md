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
│   └── routes/
├── components/
│   ├── layout/
│   ├── pages/
│   └── editor/
├── editor/
│   ├── schema/
│   ├── extensions/
│   ├── commands/
│   └── utils/
├── state/
├── data/
├── types/
├── utils/
├── pwa/
└── styles/
    └── globals.css (dengan Tailwind CSS import)
```

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

Sesuai roadmap Week 1 di `doc/prd.md`:
1. ✅ Setup project (Vite + React + TS) - **DONE**
2. ✅ Tailwind - **DONE**
3. ⏳ Page list UI
4. ⏳ CRUD pages (local memory)
5. ⏳ Integrasi Dexie & IndexedDB
