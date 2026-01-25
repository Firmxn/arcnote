# Development Rules

## Dokumentasi & Referensi
- Gunakan MCP Context7 untuk mencari dokumentasi yang diperlukan.
- Fokus pada implementasi fitur-fitur yang sudah ada di summary dengan memperhatikan dokumentasi yang tersedia.

## Pengembangan Kode
- Pecah fitur menjadi beberapa sub-fitur agar pengembangan lebih mudah.
- Gunakan best practice terhadap struktur direktori agar memudahkan pengembangan dan pemeliharaan kode.
- Berikan komentar-komentar yang jelas dan mudah dipahami pada setiap blok kode yang dibuat.

## Commit Message Guidelines
- Gunakan format **Conventional Commits**: `type(scope): description`
- **Jangan** gunakan istilah planning seperti "Phase 1", "Step 2", dll.
- Jelaskan secara spesifik apa yang ditambahkan/diubah/diperbaiki.
- Gunakan bahasa yang jelas dan deskriptif.

## Penulisan kode
- Jangan pernah mengubah kode yang tidak diperintah.
- Jangan pernah menghapus kode yang tidak diperintah.
- Jangan pernah mengubah struktur direktori yang tidak diperintah.
- terapkan konsep DRY
- terapkan best practice struktur direktori
- selalu menerapkan kode yang bekerja optimal dan bertahan jangka panjang daripada kode simpel
- konsistensi gaya penulisan kode atau mekanisme yang digunakan, misalnya pada halaman A menggunakan gaya A namun halaman B menggunakan gaya B maka harus diubah menjadi gaya yang sama, karena sebenarnya halaman A dan B secara garis besar membutuhkan mekanisme yang sama

## Penerapan prompting
- Jangan langsung implementasi setelah planning jika belum saya perintahkan

### Format Commit:
```
type(scope): short description

[optional body with details]
- Detail 1
- Detail 2
```

### Type yang Digunakan:
| Type | Kegunaan |
|------|----------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `style` | Perubahan tampilan/CSS (tanpa logic) |
| `refactor` | Refaktor kode tanpa mengubah fitur |
| `docs` | Perubahan dokumentasi |
| `chore` | Konfigurasi, dependencies, dll |

### Scope yang Umum:
- `ui` - Komponen UI, styling
- `cart` - Fitur keranjang
- `menu` - Fitur menu/produk
- `auth` - Autentikasi
- `admin` - Dashboard admin
- `api` - Backend/API calls

### Contoh Commit yang Baik:
```
feat(ui): add product detail page with customization options
fix(cart): resolve quantity not updating on increment
style(menu): improve product card hover animation
refactor(store): extract cart logic into separate hooks
```

### Contoh Commit yang Buruk:
```
Phase 1 complete
update files
fix bug
WIP
```

### Langkah yang buruk:
```
Menjalankan npm run dev tanpa diperintah
Menjalankan npm run build tanpa diperintah
Membuka chrome preview tanpa diperintah
Menjalankan commit tanpa diperintah
```