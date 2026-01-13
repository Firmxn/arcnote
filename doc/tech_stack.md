---

## 🧱 1. Environment / Tooling

| Komponen              | Versi Rekomendasi | Catatan                               |
| --------------------- | ----------------- | ------------------------------------- |
| **Node.js**           | **≥ 20.19.0**     | Requirement dari Vite 7.([vitejs][1]) |
| **npm / pnpm / yarn** | versi terbaru     | bebas, yang penting support Node 20+  |

---

## ⚙️ 2. Build & Framework

| Komponen                     | Versi      | Keterangan                                                          |
| ---------------------------- | ---------- | ------------------------------------------------------------------- |
| **vite**                     | **7.3.1**  | Latest stable saat ini.([npmjs.com][2])                             |
| **@vitejs/plugin-react-swc** | **4.2.2**  | Plugin resmi React + SWC, kompatibel dengan Vite 7.([npmjs.com][3]) |
| **react**                    | **18.2.0** | Versi stabil yang umum dipakai                                      |
| **react-dom**                | **18.2.0** | Harus match dengan `react`                                          |
| **typescript**               | **5.9.3**  | Latest stable TS 5.x.([npmjs.com][4])                               |

---

## 🎨 3. Styling (Tailwind v4)

Tailwind v4 sekarang diintegrasikan lewat plugin Vite:

| Komponen              | Versi      | Keterangan                                              |
| --------------------- | ---------- | ------------------------------------------------------- |
| **@tailwindcss/vite** | **4.1.18** | Plugin resmi Tailwind v4 untuk Vite                          |

Lalu di global CSS kamu cukup:

```css
@import "tailwindcss";
```

Tanpa perlu `tailwind.config.js` dan tanpa PostCSS manual (kecuali kamu butuh advanced setup).

---

## ✍️ 4. Editor (Tiptap)

Untuk project baru, lebih masuk akal langsung pakai **Tiptap v3** (bukan v2 lagi), karena v3 sudah stable dan dokumentasi React + Vite-nya jelas.([npmjs.com][6])

| Package                        | Versi      |
| ------------------------------ | ---------- |
| **@tiptap/react**              | **3.15.3** |
| **@tiptap/core**               | **3.15.3** |
| **@tiptap/pm**                 | **3.15.3** |
| **@tiptap/starter-kit**        | **3.15.3** |
| (ext lain: heading, list, dsb) | **3.15.3** |

> Semua package Tiptap sebaiknya **satu versi** supaya aman.

---

## 🗄 5. Data & State

### IndexedDB (Dexie)

| Package               | Versi     | Keterangan                                     |
| --------------------- | --------- | ---------------------------------------------- |
| **dexie**             | **4.2.1** | Latest stable 4.x.([npmjs.com][7])             |
| **dexie-react-hooks** | **4.2.0** | Hooks resmi Dexie untuk React.([npmjs.com][8]) |

### State management (Zustand)

| Package     | Versi     | Keterangan                                          |
| ----------- | --------- | --------------------------------------------------- |
| **zustand** | **5.0.9** | Latest stable, kompatibel React 18.([npmjs.com][9]) |
| **react-router-dom** | **7.12.0** | Routing library untuk navigasi antar halaman |

### Cloud Storage (Supabase)

| Package                   | Versi      | Keterangan                                     |
| ------------------------- | ---------- | ---------------------------------------------- |
| **@supabase/supabase-js** | **2.90.1** | Client library resmi untuk Supabase integration |

---

## 📱 6. Mobile & PWA

| Package             | Versi     | Keterangan                                                   |
| ------------------- | --------- | ------------------------------------------------------------ |
| **vite-plugin-pwa** | **1.0.0** | Versi terbaru, support Vite 5–7 dan Workbox 7.([GitHub][10]) |
| **@capacitor/core** | **8.0.0** | Native bridge core.                                          |
| **@capacitor/android**| **8.0.0**| Android platform specific runtime.                          |
| **@capacitor/cli**  | **8.0.0** | CLI tools untuk build native apps.                           |

---

## 🧰 7. Utilitas Pendukung

| Package    | Versi       | Keterangan                                  |
| ---------- | ----------- | ------------------------------------------- |
| **nanoid** | **5.1.6**   | ID generator kecil & aman.([npmjs.com][11]) |
| **dayjs**  | **1.11.19** | Library waktu ringan.([npmjs.com][12])      |
| **clsx**   | **2.1.1**   | Helper `className` kecil.([npmjs.com][13])  |

---

## 📦 8. Contoh `package.json` (inti)

Ini contoh minimal supaya kamu bisa langsung `npm install` dan mulai:

```jsonc
{
  "name": "arcnote",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-router-dom": "7.12.0",

    "@tiptap/react": "3.15.3",
    "@tiptap/core": "3.15.3",
    "@tiptap/pm": "3.15.3",
    "@tiptap/starter-kit": "3.15.3",

    "dexie": "4.2.1",
    "dexie-react-hooks": "4.2.0",

    "@supabase/supabase-js": "2.90.1",

    "zustand": "5.0.9",

    "nanoid": "5.1.6",
    "dayjs": "1.11.19",
    "clsx": "2.1.1"
  },
  "devDependencies": {
    "vite": "7.3.1",
    "@vitejs/plugin-react-swc": "4.2.2",

    "@tailwindcss/vite": "4.1.18",

    "typescript": "5.9.3",
    "vite-plugin-pwa": "1.0.0"
  }
}
```

Semua paket di atas:

* **Kompatibel dengan Tailwind v4** (karena Tailwind di-level bundler/Vite, tidak “nyentuh” Tiptap/Dexie/Zustand langsung).
* Kompatibel satu sama lain (React 18 + Vite 7 + plugin resmi + Tiptap v3).
* Cukup modern buat dipakai beberapa tahun ke depan tanpa ganti major stack.

---

