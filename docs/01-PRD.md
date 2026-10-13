# 01 — Product Requirements Document (PRD)

## 1. Ringkasan
UndanganE adalah platform SaaS undangan digital mandiri (self-service) berbahasa Indonesia. Pelanggan memilih template, mengedit, mengelola tamu, membayar via QRIS, lalu mempublikasikan undangan tanpa jasa desain manual.

Prinsip inti:
- Satu katalog template & satu invitation engine untuk semua jenis akun.
- Perbedaan reguler vs reseller hanya pada **harga publikasi** (dihitung server saat checkout) dan fitur catatan pelanggan.
- Harga, batas, dan aturan bisnis lain **dikonfigurasi admin**, bukan hardcode.
- Pembayaran: **Duitku QRIS-only** (akun individual pemilik).
- Template internal dibuat bervariasi (animasi, foto, palet) agar katalog tidak monoton.
- Aplikasi **SEO friendly** (lihat `19-SEO.md`).

## 2. Kategori acara yang didukung
Pernikahan, Tunangan, Ulang Tahun, Aqiqah, Khitanan, Keluarga/Arisan, Seminar/Webinar, Syukuran/Perayaan. Kategori dikelola admin (tambah/kurang tanpa deploy).

## 3. Persona

### 3.1 Rina — Pengguna reguler (calon pengantin)
- Butuh undangan cantik dalam <1 jam, bayar sekali.
- Alur: daftar → pilih template → edit teks/foto/musik/section → tambah tamu (impor CSV / biarkan tamu daftar sendiri via link) → checkout QRIS → bayar → terbit → bagikan link → pantau RSVP → check-in QR di hari-H.

### 3.2 Pak Dedi — Reseller (event organizer)
- **Jalur menjadi reseller**: mendaftar sebagai user biasa → halaman "Upgrade Reseller" → bayar **biaya upgrade sekali bayar** (mis. Rp50.000, diatur admin) via QRIS → role `reseller` aktif otomatis setelah pembayaran terkonfirmasi. Tidak ada pilihan role saat pendaftaran (mitigasi agar tidak semua orang langsung dapat harga grosir).
- Menu & editor **sama persis** dengan reguler.
- Membuat undangan atas nama banyak pelanggan: mencatat nama pelanggan + harga jual (bookkeeping internal, bukan dompet).
- Harga publikasi platform **lebih murah** untuk role reseller (berlaku untuk order berikutnya setelah upgrade).
- Mendapat **link kelola privat per pelanggan** → pelanggan melihat daftar tamu & check-in tanpa akun, tanpa melihat data reseller lain.

### 3.3 Sari — Kontributor (DESAIN UNTUK FASE NANTI, tidak di MVP)
- Dashboard terpisah, submit template via SDK, review admin, kompensasi. Detail: `07`, `08`, `12`.

### 3.4 Admin Agus
- Operasional: pengguna, undangan, template, kategori, pesanan, pembayaran, **harga**, **voucher**, kompensasi, payout, pengaturan, log audit. Antarmuka padat data, bukan kartu promosi.

### 3.5 Tamu (anonim)
- Membuka link (umum / `?kepada=Nama` / `?g=kode`) → melihat undangan → RSVP → buku tamu → QR kehadiran → check-in di pintu.

## 4. Alur E2E utama
1. **Reguler**: daftar (selalu user biasa) → buat undangan → edit → checkout (voucher opsional) → QRIS → webhook sukses → undangan aktif → bagikan → RSVP → check-in.
2. **Calon reseller**: daftar → bayar upgrade (QRIS) → role aktif → membuat undangan dengan harga reseller + data pelanggan + link kelola dibagikan ke pelanggan.
3. **Tamu via URL**: link blast `?kepada=Nama` → tamu baru auto-terdaftar → RSVP → QR muncul → check-in.
4. **Admin**: ubah harga → kelola voucher → pantau pesanan → rekonsiliasi pembayaran.

## 5. Kebutuhan fungsional (MVP)
- Auth email/password + Google; role user/reseller/contributor(disembunyikan di MVP)/admin.
- Katalog template publik + galeri + kategori (SEO-friendly).
- Editor: panel + live preview, teks, foto (upload), musik, visibilitas section, tema (warna/font dalam batas template), autosave, slug.
- Invitation engine: cover, countdown, jadwal multi-acara + peta, galeri, cerita, hadiah (rekening/e-wallet), RSVP, buku tamu, musik autoplay-safe, QR tamu.
- Lifecycle: draft → (bayar) → aktif → kedaluwarsa → arsip.
- Tamu: CRUD, grup, impor CSV/XLSX, auto-create via URL, QR per tamu, check-in + log duplikat.
- Link kelola privat (token di-hash, bisa dicabut).
- Harga admin-configurable per role; voucher diskon (persen/nominal) dengan batas pakai & masa berlaku.
- Upgrade reseller berbayar (sekali bayar, harga admin-configurable) via QRIS + pemberian role otomatis + pencabutan oleh admin.
- Pesanan + pembayaran QRIS Duitku dengan webhook idempoten.
- Admin panel + log audit + pengaturan.

## 6. Non-fungsional
- **SEO**: SSR halaman publik & undangan, metadata, OG image, sitemap, JSON-LD (`19-SEO.md`).
- Mobile-first (mayoritas dibuka di HP), aksesibel (kontras, fokus, alt), `id` locale.
- Otorisasi selalu server-side; isolasi data antar pengguna.
- Biaya infra rendah: VPS + Docker + layanan gratis pendukung (`15`).
- Performa: LCP halaman undangan < 2.5s di jaringan 4G; gambar teroptimasi.

## 7. Di luar MVP
Wallet, langganan reseller, pembayaran customer→reseller, aplikasi native, multi-mata uang, marketplace kontributor berbasis kode (desain siap di `08`), WhatsApp broadcast otomatis, AI.

## 8. Risiko produk utama
- Spam/tamu palsu via auto-create → mitigasi di `10`.
- Webhook gagal → status check terbatas + dashboard admin (`11`).
- Monotoni katalog → pabrik template + varian palet (`06`).
- SEO terpengaruh bila kelak pakai iframe kontributor → dicatat di `08`/`19` (first-party selalu SSR).
