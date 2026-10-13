# 02 — Arsitektur Teknis

## 1. Stack (disesuaikan keputusan pemilik)
- **App**: Next.js (App Router) + React + TypeScript strict, Tailwind CSS + shadcn/ui, Zod.
- **DB**: PostgreSQL + Drizzle ORM (migrasi Drizzle Kit, forward-only).
- **Auth**: Better Auth (credentials + Google, sesi HttpOnly cookie) — alternatif Auth.js v5, keputusan akhir saat Fase 2.
- **Aset**: Cloudflare R2 (S3-compatible, gratis 10GB, 0 egress).
- **Pembayaran**: Duitku API v2 — **QRIS only** (`11-PEMBAYARAN-DUITKU.md`).
- **QR**: `qrcode` (generate server), `@zxing/browser` (scan kamera).
- **Email**: Resend/Brevo (SMTP/HTTP, gratis).
- **Redis**: di Docker di VPS yang sama — rate limiting, cache settings/`pricing_rules`, antrean job (BullMQ: email, retry webhook/status-check, nanti build queue).
- **Monitoring**: Uptime Kuma (self-host) + Sentry free.
- **Hosting**: 1 VPS + **Docker Compose penuh** (semua layanan container) + Caddy (HTTPS otomatis) (`15`); **PostgreSQL container dengan port host 5433**.

## 2. Gaya arsitektur
**Modular monolith** — satu aplikasi Next.js, struktur folder per domain, dependensi mengarah inward ke `core/`. Tanpa microservice di MVP.

```
UndanganE/
├── brand/                    # EXISTING — sumber brand, jangan diubah
├── docs/                     # dokumen plan ini
├── public/brand/{logo,png}   # hasil salin per brand/README §8
├── src/
│   ├── core/                 # zod schemas, money, result, errors, config(env), logger
│   ├── auth/                 # session, guard, rbac (requireRole/requireOwner)
│   ├── db/                   # drizzle client, schema/, migrations/, seed/
│   ├── modules/
│   │   ├── users/  invitations/  templates/  categories/  guests/
│   │   ├── checkin/  pricing/  vouchers/  orders/  payments/
│   │   ├── reseller/  settings/  audit/  media/
│   ├── engine/               # invitation engine: sections, tokens, renderer, templates/<slug>/
│   ├── editor/               # state editor, panel, live preview bridge
│   ├── components/
│   │   ├── ui/               # shadcn/ui + token brand
│   │   └── brand/            # <UndanganELogo> dari generated/logo-paths.ts
│   ├── app/
│   │   ├── (public)/         # landing, template, harga, faq, panduan (SEO)
│   │   ├── (auth)/
│   │   ├── (app)/            # dashboard user/reseller
│   │   ├── (admin)/
│   │   ├── i/[slug]/         # undangan publik (SSR, SEO)
│   │   ├── kelola/[token]/   # link kelola privat
│   │   └── api/              # route handlers (webhook, public, bridge)
│   └── workers/              # entry worker (cron internal / future build sandbox)
├── e2e/                      # Playwright
├── docker-compose.yml        # caddy, app, postgres(5433), redis, kuma
├── Dockerfile
└── Caddyfile
```

## 3. Origin & batasan keamanan
| Origin | Peran |
|---|---|
| `app.<domain>` | Aplikasi terpercaya (dashboard, editor, admin, API) |
| `invite.<domain>` | Undangan publik (SSR, SEO) — cookie aplikasi tidak dikirim ke sini secara default (SameSite) |
| `tpl.<domain>` | Bundle statis template (untuk preview iframe fase kontributor nanti) |

MVP first-party dirender **SSR di origin app/invite** (HTML nyata → SEO optimal). Desain origin `tpl.` disiapkan untuk fase kontributor (`08`).

## 4. Rendering strategy (wajib untuk SEO)
- Halaman publik & undangan: **SSR** (`dynamic` render per slug) dengan `generateMetadata` per halaman.
- Dashboard/admin: client-heavy diperbolehkan (tidak diindeks; `robots: noindex`).
- Data undangan publik: projection publik saja (tanpa PII pemilik/tamu).
- Lihat `19-SEO.md` untuk metadata, OG image, sitemap, JSON-LD.

## 5. Akses data
- Semua query lewat fungsi repository ber-scope (`where owner_id = ...`), Zod validasi input.
- Uang: integer **IDR**. Harga selalu dibaca dari `pricing_rules`/voucher di server.
- Settings bisnis (batas tamu, harga upgrade reseller, fitur flag) di tabel `settings` (JSONB), **di-cache di Redis** (TTL 60s, invalidasi saat admin ubah).
- Rate limiting & job queue memakai Redis (fallback in-memory bila Redis down — aplikasi tetap jalan).

## 6. Auth & sesi
- Cookie HttpOnly + Secure + SameSite=Lax, rotasi sesi saat login, rate-limit login.
- 2FA wajib untuk admin saat GA.
- Link kelola memakai token terpisah (bukan sesi) — `09`.

## 7. Konfigurasi env (ringkas; daftar lengkap di `15`)
`DATABASE_URL` (Postgres Docker, host port **5433**), `REDIS_URL`, `AUTH_SECRET`, `APP_URL`, `INVITE_URL`, `R2_*`, `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_QRIS_CODE`, `DUITKU_CALLBACK_URL`, `QR_HMAC_SECRET`, `PAYOUT_ENCRYPTION_KEY`, `RESEND_API_KEY`.

## 8. Keputusan teknis kunci & alasannya
1. **Monolith** — transaksi order↔publish atomik, satu tim, satu deploy.
2. **Drizzle+Postgres di Docker (port 5433)** — typed; semua stack containerized; port 5433 menghindari bentrok dengan Postgres host lokal.
3. **Redis di Docker** — rate limiting andalan (tahan multi-instance), cache settings/harga, antrean job email & retry pembayaran (keputusan pemilik: Redis dipakai).
4. **First-party SSR** — SEO & performa; iframe sandbox hanya untuk kode tak-terpercaya (fase nanti).
5. **Duitku langsung (bukan aggregator)** — sesuai keputusan pemilik; abstraction `PaymentProvider` tetap dipertahankan agar provider lain bisa ditambah.
6. **Semua di Docker Compose** — dev lokal identik produksi; satu file compose untuk VPS.
