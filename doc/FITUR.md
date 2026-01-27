# 🚀 Fitur Implementasi

Dokumen ini mencatat fitur-fitur yang telah diimplementasikan dalam **ArcNote** beserta statusnya.

## 📝 1. Pages (Block-based Editor)
- [x] **Block Editor**: Menggunakan Tiptap v3.
- [x] **Basic Blocks**: Paragraph, Heading, Lists (Bullet/Ordered), Todo List, Quote, Divider.
- [x] **Slash Command**: Menu cepat `/` untuk insert block.
- [ ] **Advanced Blocks**: Table, Callout, Toggle (Planned Phase 4).
- [ ] **Image Upload**: Belum ada (MVP text-focused).

## 📅 2. Schedules (Calendar)
- [x] **Desktop View**: Grid kalender bulanan penuh.
- [x] **Mobile View**: Tampilan compact per hari (Day View).
- [x] **Navigation**: Month & Year Picker custom.
- [x] **Event Management**:
  - Create (Drafting mode sebelum save).
  - Edit & Delete.
  - Tipe Event: Meeting, Task, Deadlines, Personal.
  - Validasi tanggal masa lalu (Confirmation Dialog).
- [x] **Badge Event**: Indikator visual tipe event di kalender.

## 💰 3. Finance (Expense Tracker)
### Wallets (Accounts)
- [x] **Multi-wallet**: Kelola banyak "dompet" atau akun terpisah.
- [x] **Customization**: Nama, Deskripsi, Tema Warna (Gradient), Currency (IDR default).
- [x] **Balances**: Kalkulasi saldo real-time per wallet dan global.
- [x] **Transfers**: Transfer saldo antar wallet dengan pencatatan otomatis (Expense di sumber, Income di tujuan).
- [x] **Privacy Mode**: Sembunyikan nominal saldo (Masking `******`).

### Transactions
- [x] **CRUD**: Tambah, Edit, Hapus transaksi.
- [x] **Kategori**: Income & Expense.
- [x] **History**: List transaksi dengan sorting (Newest Date + Newest Entry).
- [x] **Summary**: Total Income, Expense, dan Net Balance (Bulanan).

### Budgets
- [x] **Budgeting**: Tetapkan target pengeluaran (Mingguan/Bulanan).
- [x] **Tracking**: Progress bar visual (Hijau -> Kuning -> Merah).
- [x] **Assignments**: Assign transaksi spesifik ke budget tertentu.

## 🔄 4. Data & Sync
- [x] **Local-First**: Dexie.js (IndexedDB) sebagai "Source of Truth" utama.
- [x] **Offline Capable**: Aplikasi berjalan 100% tanpa internet.
- [x] **Cloud Sync**: Supabase integration.
  - [x] **Auth**: Google Login & Email/Password.
  - [ ] **Background Sync**: Sync queue mechanism (Partial/In-Progress).

## 📱 5. Mobile & PWA
- [x] **Responsive UI**: Logika `isMobile` untuk render komponen adaptif (Sheet vs Modal).
- [x] **Action Sheet**: Menu konteks native-like untuk mobile (Long press).
- [x] **FAB**: Floating Action Button untuk aksi utama.
- [x] **Safe Area**: Handling notch/status bar di Android.
- [x] **Capacitor**: Build APK native Android.

## 🎨 6. UI/UX
- [x] **Theming**: Light/Dark mode support (Linear-like aesthetics).
- [x] **Tailwind v4**: Styling engine modern.
- [x] **Animations**: Micro-interactions (Hover, Modal transitions).
