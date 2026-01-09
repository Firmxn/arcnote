# 📘 ArcNote

**ArcNote** adalah aplikasi pencatatan **block-based** yang ringan, cepat, dan mengutamakan privasi dengan pendekatan **offline-first**. Dirancang untuk penggunaan personal, ArcNote memungkinkan Anda menulis catatan dengan struktur fleksibel berbasis block, mirip dengan Notion namun tanpa ketergantungan pada backend.

---

## 🚀 Vision
> *"A fast, offline-first, personal block-based note-taking app that works everywhere, with zero backend dependencies."*

---

## ✨ Fitur Utama (MVP)
- **Block-based Editor**: Mendukung Paragraph, Heading (H1-H3), List, Todo, Quote, dan Divider.
- **Slash Command**: Akses cepat perintah editor menggunakan `/`.
- **Offline-first**: Semua data disimpan secara lokal menggunakan IndexedDB.
- **PWA Ready**: Dapat diinstal di Android/Desktop dan digunakan secara offline.
- **Privacy Focused**: Tidak ada login, tidak ada pelacakan data ke cloud (di versi MVP).

---

## 🛠️ Tech Stack
| Komponen | Teknologi |
|----------|-----------|
| **Frontend Framework** | React 18 & Vite 7 |
| **Editor Engine** | Tiptap v3 |
| **Styling** | Tailwind CSS v4 |
| **Local Database** | Dexie.js (IndexedDB) |
| **State Management** | Zustand |
| **PWA Support** | vite-plugin-pwa |
| **Utilities** | TypeScript, nanoid, dayjs, clsx |

---

## 📂 Struktur Proyek
Sesuai dengan `doc/prd.md`, struktur direktori mengikuti pola modular:
- `src/app/`: Routing dan entry point.
- `src/components/`: Komponen UI dan Layout.
- `src/editor/`: Logika, ekstensi, dan skema Tiptap.
- `src/state/`: Zustand stores.
- `src/data/`: Layer akses data (Dexie repositories).
- `src/types/`: Definisi TypeScript.

---

## 🛠️ Pengembangan (Local Setup)

### Prasyarat
- Node.js ≥ 20.19.0
- npm / pnpm / yarn

### Instalasi
```bash
# Clone repository
git clone https://github.com/Firmxn/arcnote.git

# Masuk ke direktori
cd arcnote

# Install dependencies (akan tersedia setelah project diinisialisasi)
# npm install
```

### Jalankan Development Server
```bash
# npm run dev
```

---

## 📜 Aturan Pengembangan
Proyek ini mengikuti standar pengembangan di `doc/rules.md`:
- **Commit Message**: Mengikuti standar [Conventional Commits](https://www.conventionalcommits.org/).
  - Format: `type(scope): description`
  - Contoh: `feat(editor): add todo list block support`
- **Bahasa**: Dokumentasi internal dan komentar kode menggunakan **Bahasa Indonesia**.

---

## 📄 Lisensi
[MIT License](LICENSE) (Jika berlaku)