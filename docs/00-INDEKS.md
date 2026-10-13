# UndanganE — Indeks Dokumen Plan

Status: **PLAN FINAL (Phase 0) — DISETUJUI PEMILIK, menunggu eksekusi coding.**
Bahasa: Indonesia. Dokumen ini adalah sumber kebenaran arsitektur & produk sebelum implementasi.

## Peta dokumen

| No | File | Isi |
|----|------|-----|
| 00 | `00-INDEKS.md` | Dokumen ini — peta & status |
| 01 | `01-PRD.md` | Visi produk, persona, alur E2E, MVP vs future |
| 02 | `02-ARSITEKTUR.md` | Stack, modular monolith, struktur folder, rendering strategy (SSR/SEO) |
| 03 | `03-MODEL-DATA.md` | ERD, tabel, constraint, indeks (termasuk voucher) |
| 04 | `04-PERAN-DAN-HAK-AKSES.md` | Matriks role × kapabilitas, strategi otorisasi |
| 05 | `05-API-DAN-ALUR-STATE.md` | Route/server action, state machine (undangan, order, bayar) |
| 06 | `06-INVITATION-ENGINE.md` | Section registry, theme tokens, katalog 24 template |
| 07 | `07-TEMPLATE-SDK.md` | Kontrak SDK v1 (persiapan fase kontributor) |
| 08 | `08-SANDBOX-KONTRIBUTOR.md` | Arsitektur build terisolasi (DESAIN, dieksekusi setelah revenue) |
| 09 | `09-QR-DAN-LINK-MANAJEMEN.md` | QR tamu, link kelola privat, kebijakan token |
| 10 | `10-AKSES-TAMU-VIA-URL.md` | Akses via URL → auto-create tamu, anti-spam |
| 11 | `11-PEMBAYARAN-DUITKU.md` | Duitku QRIS-only (akun individual), voucher di checkout |
| 12 | `12-KOMPENSASI-PAYOUT.md` | Ledger kompensasi kontributor & payout (fase nanti) |
| 13 | `13-KEAMANAN.md` | Threat model + mitigasi |
| 14 | `14-PENGUJIAN.md` | Strategi pengujian (authz, payment, sandbox, E2E, SEO) |
| 15 | `15-DEPLOYMENT-OPS.md` | VPS+Docker, env, domain, backup, monitoring, cost |
| 16 | `16-ROADMAP.md` | 12 fase, dependensi, acceptance criteria |
| 17 | `17-KEPUTUSAN-BISNIS.md` | Log keputusan (terbuka & terjawab) |
| 18 | `18-BRAND.md` | Sistem desain UI: minimal, modern, mengikuti brand |
| 19 | `19-SEO.md` | Strategi SEO: SSR, metadata, OG, sitemap, JSON-LD |

## Keputusan pemilik yang sudah terkunci

1. **Harga publikasi** → diubah admin (`pricing_rules`), BUKAN hardcode.
2. **Voucher diskon** → fitur wajib di checkout (input kode → validasi server → potongan).
3. **Pembayaran** → akun **Duitku individual**, **QRIS only**, kredensial via `.env` (pemilik sudah punya akun).
4. **Domain** → belum dibeli; rekomendasi pembelian & DNS ada di `15-DEPLOYMENT-OPS.md`.
5. **Infrastruktur** → VPS murah + Docker Compose (biaya ≈ Rp100–130rb/bln).
6. **Template** → **internal/first-party saja** untuk MVP, katalog **bervariasi & banyak (target 24+)**, animasi & foto tidak monoton. Fitur kontributor berbasis kode **ditunda** (desain disimpan di 08).
7. **Batas tamu auto-create** → 10/jam/IP, 1000/undangan (configurable).
8. **Pajak** → penghasilan perorangan Duitku = tanggung jawab pemilik (dicatat di 17).
9. **Desain UI** → **tidak banyak warna, modern, sesuai brand** (teal + charcoal, tanpa gradient) → `18-BRAND.md`.
10. **SEO** → aplikasi wajib **SEO friendly** → `19-SEO.md`.
11. **Reseller** → pendaftaran selalu `user` biasa (tanpa pilihan role); **upgrade berbayar sekali bayar** (mis. Rp50.000, harga diatur admin) via QRIS Duitku → role `reseller` aktif otomatis setelah bayar. Mitigasi anti-abuse harga grosir.
12. **Redis** → dipakai (rate limit, cache settings/harga, antrean job email/webhook) — di Docker di VPS yang sama.
13. **Docker penuh** → semua layanan berjalan di Docker Compose; **PostgreSQL di Docker dengan port host 5433**.

## Prinsip kerja dokumen ini

- Plan dulu, coding setelah persetujuan per fase (`16-ROADMAP.md`).
- Perubahan keputusan dicatat di `17-KEPUTUSAN-BISNIS.md` (append-only).
- Repo `brand/` tidak disentuh; aset disalin sesuai `brand/README.md` §8.
