# 14 — Strategi Pengujian

## 1. Pyramid
1. **Unit (Vitest)** — skema Zod, perhitungan harga & voucher, state machine, HMAC Duitku, token/QR, normalisasi nama, parser CSV.
2. **Integrasi DB** — repository dengan Postgres testcontainer/pg-mem (pilih testcontainer untuk kesetaraan).
3. **E2E (Playwright)** — journey nyata di environment compose staging.
4. **Keamanan & performa** — authz matrix, Lighthouse, k6 smoke.

## 2. Authz matrix (wajib hijau)
Tabel generatif: role (anon|user|reseller|admin|manage-token) × resource (invitation lain, guest lain, order lain, admin route) × aksi (read|write) → expect 401/403/200. Termasuk IDOR fuzz pada semua `[id]`.

## 3. Pembayaran (Duitku)
- Unit: formula signature inquiry & callback (fixtures resmi).
- Integration: webhook sukses/gagal/duplikat/out-of-order → assert order & invitation; voucher: happy path, kadaluwarsa, kuota habis, min order, applies_to, kompensasi saat expired.
- **Upgrade reseller**: order `kind=reseller_upgrade` → webhook paid → role granted tepat sekali (webhook ganda idempoten); harga diambil dari settings saat order dibuat (ubah setting tidak mengubah order lama); voucher ditolak untuk order upgrade; refund + opsi cabut role.
- Mock provider `dummy` untuk E2E tanpa jaringan; 1 skenario sandbox Duitku manual per release.

## 4. Tamu & QR
- Resolusi URL: `?kepada=` baru → create; sama → bind; `?g=` valid/invalid; cookie persist.
- Limit IP & cap undangan.
- Check-in: sukses, duplikat (409 + log), QR salah undangan (403).

## 5. Engine & template
- Snapshot visual (Playwright screenshot) 375/768/1280 untuk 24 template — regression saat refactor engine.
- Uji section visibility toggle, musik unlock, countdown timezone Asia/Jakarta.

## 6. SEO (CI)
- Halaman publik & `/i/[slug]`: assert ada `<title>`, meta description, OG tags, canonical, JSON-LD Event, sitemap berisi slug aktif, robots tidak memblokir `invite.`, `/app`+`/admin` noindex.
- Cek gambar punya `alt` & `next/image` dimensions (CLS).

## 7. Aksesibilitas & performa
- axe-core smoke pada landing & undangan (kontras brand sudah dirancang AA).
- Lighthouse CI budget: performance ≥ 85 landing, ≥ 80 undangan; LCP < 2.5s simulasi 4G.
- k6 smoke: RSVP endpoint 50 VU 1 menit; halaman undangan SSR 100 VU.

## 8. Environment
- `docker compose` dev lokal identik produksi: caddy, app, **postgres (port host 5433)**, **redis**, (opsional minio-compat untuk R2).
- CI GitHub Actions: lint → tsc → unit → authz → build → E2E smoke (compose).
- Seed: admin, 2 template aktif, user, akun reseller-contoh (upgrade dibayar dummy), undangan contoh, voucher contoh.
