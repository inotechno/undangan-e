# 16 — Roadmap Implementasi

> Urutan fase menyesuaikan keputusan: template internal banyak (bukan kontributor), Duitku QRIS-only, voucher, SEO sejak awal.

| Fase | Deliverable | Depends | Acceptance criteria |
|---|---|---|---|
| **0** | Plan `docs/` ini disetujui | — | Pemilik approve; keputusan di `17` tercatat |
| **1** | Scaffold Next+TS strict+Tailwind+shadcn, Drizzle+Postgres (**compose: postgres port 5433 + redis**), Better Auth, RBAC, settings, audit, CI, compose dev, salin aset brand + `<UndanganELogo>` | 0 | Daftar/login/role jalan (daftar selalu user); `tsc` bersih; migrasi dari nol OK |
| **2** | Design system brand (`18`) + landing, galeri template, harga, FAQ, panduan, halaman auth (SSR, SEO dasar) | 1 | Lighthouse ≥ 90; copy Indonesia; logo resmi tampil |
| **3** | Invitation engine (sections, tokens) + **Batch 1 template (6)** SSR publik + metadata | 1 | 1 template tampil di 3 breakpoint; data event di HTML |
| **4** | Editor (panel+preview, media R2, autosave, slug, lifecycle) | 3 | Edit→preview mulus di HP; tak ada data hilang reload |
| **5** | Pricing admin + **voucher** + pesanan + **Duitku QRIS** + webhook idempoten + halaman bayar (QR) | 4 | E2E bayar→terbit lulus; voucher happy+negative path; webhook duplikat aman |
| **6** | Tamu: CRUD, grup, impor CSV, **akses URL auto-create** (`10`), QR per tamu, check-in + link kelola (`09`) | 4 | Link `?kepada=` membuat tamu; duplikat check-in warning; token cabut langsung mati |
| **7** | Reseller: **upgrade berbayar sekali bayar** (QRIS, harga admin-configurable) + grant role otomatis, catatan pelanggan+harga jual, harga khusus di checkout, kelola-link per pelanggan, pencabutan role oleh admin | 5,6 | Upgrade paid → reseller aktif idempoten; reseller hanya lihat datanya; pelanggan pakai link tanpa akun |
| **8** | Admin panel lengkap: pengguna, undangan, kategori, harga, voucher CRUD, orders/refund tandai, settings, audit | 5,6 | Semua aksi sensitif ter-audit; UI padat data |
| **9** | **Batch 2 template (sisa 18)** + varian palet + screenshot katalog + SEO per template | 3 | 24 template aktif; snapshot visual lulus; OG tiap template |
| **10** | SEO penuh: sitemap, JSON-LD, OG image otomatis, canonical, noindex area privat (`19`) | 2,3 | Checklist `19` semua centang |
| **11** | Hardening: rate limit, headers, backup+restore-test, monitoring, aksesibilitas, k6 smoke | semua | Threat model `13` termitigasi/diterima tertulis |
| **12** | GA produksi: domain final, Duitku live, harga & voucher produksi, seed dibersihkan | 11 | Checklist rilis `15` lulus |

### Setelah GA (terjadwal, bukan MVP)
- Fase K1: SDK kontributor + sandbox build (`07`, `08`) — butuh review keamanan.
- Fase K2: review/persetujuan template + katalog komunitas.
- Fase K3: kompensasi & payout (`12`).
- Opsional: WhatsApp notifikasi RSVP, export PDF buku tamu, multi-bahasa EN.

### Paralelisasi
- Template batch (Fase 3/9) bisa dikerjakan paralel dengan editor/payments selama kontrak `InvitationConfig` (Fase 3 awal) dikunci.
- SEO (Fase 10) sebagian sudah dibangun dari Fase 2–3 (metadata dasar) — Fase 10 = penyempurnaan.

### Definition of Done (umum)
Fitur = code + test (unit + authz) + UI empty/loading/error + audit (jika sensitif) + docs `docs/` diperbarui bila mengubah keputusan.
