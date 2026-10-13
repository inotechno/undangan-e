# 15 — Deployment, Ops, Domain & Biaya

## 1. Topologi (keputusan pemilik: VPS murah + Docker penuh)
```
VPS (2 vCPU / 2–4 GB RAM cukup untuk MVP) — SEMUA container via docker-compose.yml
├── caddy         # HTTPS otomatis (Let's Encrypt), router subdomain
├── app           # Next.js standalone (build image sendiri)
├── postgres:16   # port host 5433 → 5432 container (hindari bentrok Postgres host)
│                 # volume persist + cron pg_dump harian → R2
├── redis         # rate limit, cache settings/harga, antrean job (BullMQ)
├── uptime-kuma   # monitoring uptime
└── (nanti) worker build sandbox kontributor
Aset external gratis:
├── Cloudflare R2    # media & (nanti) bundle template — 10GB, 0 egress
├── Resend / Brevo   # email transaksional
└── Sentry (free)    # error tracking
```

## 2. Domain (belum dibeli — panduan)
Kebutuhan: 1 domain utama + subdomain. Duitku butuh **URL publik HTTPS** untuk callback.

**Rekomendasi:**
1. Cek ketersediaan `undangane.com` (prioritas, murah ~$10–12/thn di registrar seperti Niagahoster/Porkbun/Cloudflare Registrar).
2. Alternatif: `undangane.id` (lebih "lokal" tapi biaya tahunan lebih tinggi & syarat identitas) atau `undangane.my.id` (sangat murah, cukup untuk soft-launch).
3. Beli **di registrar yang mendukung DNS record bebas** (A/CNAME/TXT).

**Tabel DNS (contoh `undangane.com`):**
| Nama | Tipe | Nilai |
|---|---|---|
| `@` | A | IP VPS |
| `app` | A/CNAME | IP VPS / CNAME ke domain utama |
| `invite` | A/CNAME | IP VPS |
| `tpl` | A/CNAME | IP VPS (siap untuk fase kontributor) |
| `www` | CNAME | domain utama |

- `APP_URL=https://app.undangane.com` (dashboard, webhook)
- `INVITE_URL=https://invite.undangane.com` (opsional terpisah; MVP boleh cukup 1 host `app.` dengan route `/i/[slug]` — multi-origin disiapkan di Caddy tanpa biaya tambahan).
- Setelah beli: ceritakan domain final ke pemilik repo → masukkan ke `.env` & Caddyfile.

## 3. Docker Compose (layanan — semua container)
- `app`: image build dari repo (GitHub Actions build → push GHCR → pull di VPS).
- `postgres:16`: **publikasi port host `5433:5432`** (dev & prod konsisten; menghindari bentrok dengan instalasi Postgres di mesin); volume persist + job backup (pg_dump cron → R2).
- `redis:7`: AOF ringan; dipakai app untuk rate limit, cache, queue.
- `caddy` dengan `Caddyfile` (3 server block + TLS otomatis).
- Healthcheck semua service + `restart: unless-stopped`.
- `.env` menyediakan `DATABASE_URL=postgres://user:pass@postgres:5432/app` (internal network) — port 5433 hanya untuk akses dari luar container (ops/psql lokal).

## 4. Deploy
1. Push ke `main` → Actions: lint/test/build image → push GHCR.
2. Job deploy: SSH ke VPS → `docker compose pull && docker compose up -d` → `npm run db:migrate` (drizzle-kit migrate, urutan sebelum switch healthcheck).
3. Rollback: tag image sebelumnya + migrate forward-only (tidak ada auto-revert schema).
4. Secret: file `.env` di VPS root-only (600); tidak pernah di image.

## 5. Backup & DR
- pg_dump harian → R2 (retensi 30 hari) + weekly test restore (script `ops/restore-check.sh`).
- R2 versioning untuk media.
- Runbook restore < 30 menit: volume baru → restore dump → deploy image → verify.

## 6. Monitoring
- Uptime Kuma: cek `/`, `/i/[slug] contoh`, webhook endpoint (response 405/400 untuk GET = hidup).
- Sentry: error runtime & performance.
- Log: JSON stdout → `docker compose logs` + optional Loki gratis (bila perlu).
- Alert: webhook gagal > 5/jam, disk > 80%, backup gagal, checkout error rate.

## 7. Skala awal
MVP: 1 VPS + compose (app, postgres:5433, redis, caddy, kuma) cukup untuk ratusan undangan/bulan; rate limiting & queue sudah di Redis (multi-instance-ready). Ambang naik: pindahkan Postgres ke managed (Neon/Supabase) atau VPS kedua.

## 8. Estimasi biaya bulanan
| Pos | Biaya |
|---|---|
| VPS 2vCPU/2–4GB | ~Rp 80–110rb ($4–6) |
| Domain (rata-rata /bln) | ~Rp 15–25rb |
| R2, email, Kuma, Sentry | Rp 0 |
| **Total** | **≈ Rp 100–135rb/bln** |

## 9. Checklist rilis produksi
- [ ] Domain + DNS aktif, HTTPS hijau
- [ ] Duitku production keys, callback URL terdaftar, sandbox=false
- [ ] Harga publikasi, **harga upgrade reseller**, & voucher awal dikonfigurasi admin
- [ ] Postgres (port 5433) & Redis sehat di compose; backup pertama sukses & restore-check lolos
- [ ] Admin 2FA aktif
- [ ] `noindex` di /app & /admin; sitemap terbit
- [ ] Seed data demo dihapus
