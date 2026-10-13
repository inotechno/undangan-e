# 17 — Log Keputusan Bisnis

> Aturan: setiap perubahan keputusan = tambah baris (append), jangan hapus riwayat.

## Terjawab (terkunci)

| ID | Topik | Keputusan | Tanggal |
|---|---|---|---|
| D1 | Payment gateway | **Duitku, akun individual, QRIS only**; kredensial via `.env` (pemilik sudah punya akun) | Okt 2026 |
| D2 | Harga publikasi | **Dikonfigurasi admin** (`pricing_rules` per account_type), bukan hardcode; saran awal Rp15.000 user / Rp10.000 reseller (≥ min Duitku 10.000, sesuaikan setelah cek MDR) | Okt 2026 |
| D3 | Voucher | **Fitur wajib**: kode, percent/nominal, batas pakai, masa berlaku, applies_to, min order; redeem atomik; CRUD admin | Okt 2026 |
| D4 | Infrastruktur | VPS murah + Docker Compose + Caddy; R2 & email gratis; ±Rp100–135rb/bln | Okt 2026 |
| D5 | Template MVP | **Internal saja**; target **24 template / 8 kategori**, bervariasi animasi & foto; kontributor code-based **ditunda** | Okt 2026 |
| D6 | Domain | Belum dibeli; rekomendasi: `undangane.com` dulu, alternatif `.my.id` untuk soft-launch | Okt 2026 |
| D7 | Batas tamu auto-create | 10/jam/IP; 1000/undangan (setting) | Okt 2026 |
| D8 | Desain UI | **Tidak banyak warna, modern, mengikuti brand** teal+charcoal, tanpa gradient → `18-BRAND.md` | Okt 2026 |
| D9 | SEO | Wajib friendly (SSR, metadata, OG, sitemap, JSON-LD) → `19-SEO.md` | Okt 2026 |
| D10 | Langganan reseller | Tidak ada di MVP (upgrade reseller = **sekali bayar**, bukan subscription — lihat D15) | Okt 2026 |
| D11 | Link kelola | Revocable, non-ekspiral default, scope 1 undangan, PIN opsional | Okt 2026 |
| D12 | Pajak settlement Duitku | Penghasilan perorangan = tanggung jawab pajak pemilik (di luar sistem) | Okt 2026 |
| D13 | Auth lib | Better Auth (default) / Auth.js v5 — final saat Fase 1 | Okt 2026 |
| D14 | Redis | **Dipakai** (rate limit, cache settings/harga, antrean job) — container di compose VPS yang sama | Okt 2026 |
| D15 | Jalur jadi reseller | **Tanpa pilihan role saat daftar** (selalu user); **upgrade berbayar sekali bayar** via QRIS (mis. Rp50.000, `settings.reseller.upgrade_price_idr`, admin-configurable); role granted otomatis setelah paid; admin bisa cabut; mitigasi anti-penyalahgunaan harga grosir | Okt 2026 |
| D16 | Containerisasi | **Semua di Docker Compose**; PostgreSQL container dengan **port host 5433** | Okt 2026 |
| D17 | Fee & pajak transaksi | **Admin-configurable** di `/admin/settings`: `payment.fee_percent` (default 0,7% MDR) & `payment.tax_percent` (default 11% PPN), masing-masing dengan opsi **dibebankan ke pembeli** atau hanya dicatat; dihitung dari harga setelah diskon, **disnapshot ke kolom `orders`** (fee/tax/payable) + nominal ke Duitku = `payable_amount_idr`; rincian tampil di halaman `/bayar` (klik "Bayar" baru QR terbit) | Okt 2026 |

## Terbuka (butuh keputusan pemilik saat fase terkait)

| ID | Topik | Default rekomendasi | Butuh saat |
|---|---|---|---|
| O1 | Angka harga & fee MDR final | Konfirmasi tarif QRIS individual ke Duitku; price list final | Sebelum Fase 5 |
| O2 | Kanal QRIS: **NQ (Nobu) utama**, SP (ShopeePay) fallback; `DUITKU_QRIS_CODE` opsional untuk paksa kanal | Cek `getpaymentmethod`; lihat docs/11 §3 | Fase 5, revisi 2026-10 |
| O3 | Domain final dibeli | `undangane.com` | Sebelum Fase 12 |
| O4 | Nama & jumlah template final | Pakai daftar `06`; boleh ditambah | Fase 3/9 |
| O5 | Retensi data tamu | Auto-arsip/hapus 90 hari setelah acara | Fase 11 |
| O6 | Expired waktu bayar Duitku | `expiryPeriod` 60 menit; order expired → voucher dikembalikan | Fase 5 |
| O7 | Batas voucher per-user | `max_uses_per_user=1` untuk voucher promosi | Fase 5 |
| O8 | Buka program kontributor | Setelah revenue & review keamanan sandbox | Pasca GA |

## Perubahan kebijakan
Riwayat edit keputusan dicatat di commit message (repo akan di-init git saat Fase 1).
