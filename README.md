# 📘 ArcNote

**ArcNote** adalah aplikasi produktivitas personal yang menggabungkan catatan berbasis blok (**block-based**), manajemen jadwal, dan pelacak keuangan dalam satu platform yang ringan, cepat, dan mengutamakan privasi.

Aplikasi ini menggunakan pendekatan **Local-First Architecture**: Semua data tersimpan di perangkat Anda (IndexedDB) dan bekerja 100% offline. Sinkronisasi ke Cloud (Supabase) berjalan otomatis di latar belakang saat online.

---

## 🚀 Vision
> *"A privacy-first, local-first productivity hub that empowers personal organization with seamless cloud synchronization."*

---

## ✨ Fitur Utama

### 1. 📝 Pages (Block-based Editor)
-   **Notion-like Editor**: Pengalaman menulis berbasis blok yang intuitif.
-   **Rich Elements**: Mendukung Paragraph, Headings, Lists, To-do list, Quotes, dan Dividers.
-   **Slash Command**: Akses cepat komponen editor hanya dengan mengetik `/`.

### 2. 📅 Schedules (Calendar & Events)
-   **Visual Calendar**: Pantau jadwal Anda dalam tampilan bulanan yang bersih.
-   **Event Management**: Kelola pertemuan (Meeting), tugas (Task), dan tenggat waktu (Deadlines).
-   **Quick Preview**: Lihat detail aktivitas tanpa meninggalkan halaman kalender.

### 3. 💰 Finance (Expense Tracker)
-   **Accounts Management**: Kelola beberapa "wallet" atau akun keuangan secara terpisah.
-   **Transaction Tracking**: Catat pemasukan dan pengeluaran dengan kategori dan label.
-   **Balance Overview**: Pantau total saldo Anda secara real-time.

### 4. 🔄 Local-First & Auto Sync
-   **Offline by Default**: Data tersimpan aman di **Dexie.js (IndexedDB)**. Aplikasi instan dan responsif tanpa loading jaringan.
-   **Background Sync**: **Sync Engine** otomatis menyinkronkan perubahan lokal ke **Supabase** saat koneksi tersedia.
-   **Conflict Resolution**: Menangani perubahan offline dengan cerdas menggunakan sistem antrian (Sync Queue).
-   **Google Authentication**: Login aman untuk mengaktifkan fitur sinkronisasi cloud.
-   **Cross-Platform**: Data tersinkronisasi realtime antara Desktop, Web, dan Mobile.

### 5. 📱 Android & PWA Ready
-   **Native Android App**: Build native APK via **Capacitor v6**.
-   **Live Reload**: Debugging Android real-time dengan hot-reload via PC.
-   **PWA**: Installable on any device, fully offline capable.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
| :--- | :--- |
| **Frontend** | React 18, Vite 7, TypeScript |
| **Mobile** | Capacitor v6 (Native Android), PWA |
| **Styling** | Tailwind CSS v4 |
| **Editor** | Tiptap v3 (Prosemirror-based) |
| **Local DB** | Dexie.js (IndexedDB) |
| **Cloud DB & Auth** | Supabase (PostgreSQL) |
| **State Management** | Zustand |
| **Utilities** | DayJS, NanoID, Clsx |

---

## 📂 Struktur Proyek
-   `src/components/`: Komponen UI modular (UI components, Pages, Layouts).
-   `src/editor/`: Logika dan ekstensi kustom editor Tiptap.
-   `src/data/`: Layer akses data (Repositories untuk Dexie & Supabase).
-   `src/state/`: State management menggunakan Zustand stores.
-   `src/types/`: Definisi tipe data global (Typescript).
-   `src/styles/`: Konfigurasi Tailwind v4 dan variabel CSS global.

---

## 🛠️ Pengembangan (Local Setup)

### Prasyarat
-   Node.js ≥ 20.19.0
-   Akun Supabase (Opsional, hanya untuk fitur Cloud Sync)

### Instalasi
1.  Clone repository:
    ```bash
    git clone https://github.com/YourUsername/arcnote.git
    cd arcnote
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Konfigurasi Environment:
    Buat file `.env` di direktori root dan tambahkan kredensial Supabase Anda:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  Jalankan aplikasi:
    ```bash
    npm run dev
    ```

### Mobile Development (Android Live Reload)
1.  Pastikan PC dan HP dalam satu jaringan Wifi.
2.  Jalankan dev server dengan host ip:
    ```bash
    npm run dev -- --host
    ```
3.  Cek IP PC Anda (misal: `192.168.1.5`).
4.  Update `capacitor.config.ts`:
    ```ts
    server: {
        url: 'http://192.168.1.5:5173', // Ganti dengan IP PC Anda
        cleartext: true
    }
    ```
5.  Sync & Build:
    ```bash
    npx cap sync
    npx cap open android
    ```
    *(Atau run langsung dari Android Studio)*

---

## 📜 Aturan Pengembangan
-   **Commit Message**: Harap ikuti standar [Conventional Commits](https://www.conventionalcommits.org/).
-   **Style Guide**: Gunakan Tailwind v4 utility classes. Hindari menambahkan CSS manual kecuali sangat diperlukan.
-   **Localization**: Dokumentasi dan komentar kode diutamakan dalam **Bahasa Indonesia**.

---

## 📄 Lisensi
[MIT License](LICENSE)