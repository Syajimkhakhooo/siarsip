# BMU Digital Archive

> **Internal Digital Archive & Document Management System**  
> LPK Bahtera Mitra Unggulan (BMU)

---

## 1. Gambaran Umum

**BMU Digital Archive** adalah aplikasi internal untuk LPK Bahtera Mitra Unggulan (BMU) yang digunakan sebagai pusat penyimpanan, pengelolaan, pencarian, dan pemantauan dokumen administrasi lembaga serta dokumen peserta magang/kerja ke Jepang.

Sistem menggunakan konsep *single-admin* yang rapi, modern, dan efisien dengan antarmuka monokrom elegan berbasis Tailwind CSS.

### Teknologi
- **Frontend**: React 19, Vite 8, React Router v7
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
- **Utilities**: date-fns

---

## 2. Struktur Modul & Fitur Aplikasi

| Modul | Rute | Fitur Utama |
|---|---|---|
| **Dashboard** | `/` | Statistik arsip, peringatan masa berlaku, dokumen terbaru, riwayat aktivitas, quick actions |
| **Arsip Dokumen** | `/arsip` | Pencarian multi-kriteria, filter kategori, unggah dokumen (drag & drop), unduh berkas, favorit, trash/recycle bin |
| **Detail Dokumen** | `/arsip/:id` | Metadata lengkap, preview berkas langsung (PDF/Gambar), riwayat versi (versioning), log aktivitas dokumen |
| **Manajemen Peserta** | `/peserta` | Daftar peserta, filter status angkatan (pendaftar, pelatihan, persiapan, berangkat, alumni) |
| **Detail Peserta** | `/peserta/:id` | Profil biodata, checklist kelengkapan dokumen persyaratan magang, dokumen terkait, timeline progres |
| **Perusahaan & Rekanan**| `/perusahaan` | Data perusahaan mitra Jepang / Indonesia, kontak PIC, filter status kerja sama |
| **Job Order** | `/perusahaan/job-order` | Daftar permintaan tenaga kerja, kuota penempatan, batas waktu pendaftaran (deadline) |
| **Administrasi Surat** | `/administrasi/*` | Buku agenda Surat Masuk (`/surat-masuk`), Surat Keluar otomatis (`/surat-keluar`), Dokumen Legalitas & SOP Lembaga (`/dokumen-lembaga`) |
| **Audit Log** | `/aktivitas` | Catatan jejak audit aktivitas (unggah, sunting, hapus, pulihkan) |
| **Laporan & Rekap** | `/laporan` | Statistik kepatuhan masa berlaku berkas, distribusi kategori, mode cetak/ekspor PDF |
| **Pengaturan** | `/pengaturan` | Konfigurasi profil lembaga, kebijakan peringatan kedaluwarsa, master kategori, profil admin |

---

## 3. Langkah Instalasi & Menjalankan

### Persiapan Environment
1. Salin `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
2. Isi kredensial Supabase Anda di `.env`:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

### Setup Database & Storage di Supabase
1. Buka **Supabase Dashboard** -> **SQL Editor**.
2. Buka dan jalankan seluruh query dari berkas [`supabase/schema.sql`](./supabase/schema.sql).
3. Di **Supabase Storage**, pastikan bucket bernama `documents` telah dibuat (bila belum otomatis dibuat oleh script).

### Menjalankan Server Lokal
```bash
# Instal dependensi (jika belum)
npm install

# Menjalankan dev server
npm run dev

# Menjalankan build produksi
npm run build
```

---

## 4. Keamanan & Kebijakan Arsip
- **Soft Delete**: Berkas yang dihapus masuk ke tab *Trash* terlebih dahulu sebelum dapat dipulihkan atau dihapus secara permanen.
- **Monitoring Kedaluwarsa**: Sistem mendeteksi otomatis berkas yang akan kedaluwarsa dalam 30 hari (merah/kritis) dan 90 hari (kuning/peringatan).
- **Audit Logging**: Setiap tindakan pengarsipan dicatat ke tabel `audit_logs` untuk akuntabilitas.
