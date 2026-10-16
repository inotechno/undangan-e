# 13 — Keamanan (Threat Model & Mitigasi)

## 1. Aset
Sesi & data pengguna, data tamu (nama, phone), QR/kode tamu, token kelola, kredensial Duitku, R2 media, katalog, ledger keuangan.

## 2. Ancaman utama & mitigasi

| # | Ancaman | Mitigasi | Sisa risiko |
|---|---|---|---|
| T1 | IDOR / akses lintas user | Query ber-scope wajib; matriks authz di CI; token kelola terbatas 1 undangan | — |
| T2 | Webhook palsu / bayar tanpa bayar | HMAC callback; inbox idempoten; redirect browser bukan sumber kebenaran | Kebocoran API key (rotasi) |
| T3 | Spam tamu auto-create | Rate-limit IP, honeypot, cap per undangan, normalisasi dedupe, audit (`10`) | IP bersih masih bisa create ≤ limit |
| T4 | Kebocoran link kelola | Hash-only, multi-token cabut/regenerasi, rate limit, opsional PIN, data minimal (`09`) | Token dibagikan ke pihak salah (revoke) |
| T5 | Pemalsuan QR check-in | HMAC payload, cek scope undangan, log duplikat; QR ≠ kredensial owner | QR tamu sah dipakai orang lain (kuota) |
| T6 | Upload berbahaya (SVG XSS, oversize) | Allowlist MIME + sniff, re-encode gambar, key R2 tak dikontrol user, CSP | Zero-day lib image (patch) |
| T7 | Pencurian sesi admin | Cookie HttpOnly+Secure, 2FA wajib admin, rotasi login, audit aksi sensitif | Device trusted disalahgunakan |
| T8 | Voucher double-spend | Redeem atomik SQL + kompensasi batal | Race sempit tertangkap lock |
| T9 | Brute force auth/RSVP | Rate limit per IP/email, captcha opsional di RSVP massal | — |
| T10 | Kebocoran PII via log | Logger tanpa body pII; redaksi phone; audit meta minimal | — |
| T11 | Supply chain (app deps) | Lockfile, audit CI, dependabot/renovate + review | — |
| T12 | Kompromi VPS | SSH key-only, fail2ban di Caddy/ssh, patch otomatis, backup offsite R2 | Single VPS (backup = mitigasi) |
| T13 | XSS di konten undangan | React escaping; sanitasi buku tamu (escape, max length); CSP header | — |
| T14 | Pengungkapan data lewat URL | `guest_code` acak; tanpa id numerik; projection publik minimal (`10`) | — |

## 3. Control horizontal
- Security headers: CSP (app & invite), HSTS, Referrer-Policy, X-Content-Type-Options, frame-ancestors untuk halaman admin (`DENY`).
- `robots.txt` + `noindex` untuk /app, /admin, /kelola.
- Secrets hanya env; `.env` tidak masuk git; rotasi saat insiden.

## 4. Privasi & retensi
- Data tamu = PII: retensi default hapus/arsipkan N hari setelah acara (setting, saran 90) — keputusan pemilik di `17`.
- Permintaan hapus data (PDP Law): alur admin hapus undangan + tamu + media.

## 5. Audit & respons insiden
- `audit_logs` append-only untuk: login admin, ubah harga, CRUD voucher, refund, revoke token/QR regen, approve/revoke template (fase nanti), payout.
- Runbook insiden: (1) putus akses (rotate secrets, revoke token), (2) identifikasi dampak via log, (3) komunikasi ke pengguna terdampak, (4) patch + post-mortem tertulis di `docs/`.

## 5b. Backup & restore
- Backup harian: `powershell -File scripts\backup-db.ps1` → `backups/undangane-<timestamp>.sql.gz` (retensi 14 file terbaru, folder tidak masuk git).
- Uji berkala (mis. mingguan / sebelum deploy besar): `powershell -File scripts\restore-test.ps1` — restore dump terbaru ke DB sementara `undangane_restore_test`, bandingkan jumlah tabel + baris dengan DB asli, lalu hapus DB uji.
- Offsite: salin `backups/` ke storage terpisah (R2/S3) — jadwal & kredensial mengikuti runbook operasional pemilik.
- Redis rate-limit tidak perlu di-backup (state hilang = aman).

## 6. Uji keamanan
CI: authz matrix, signature webhook valid/invalid, sandbox escape (fase nanti), rate-limit. Manual: review dependent vuln, header scan, upload fuzzing ringan.
- Rate limit global per-IP di `src/proxy.ts` (store Redis via `src/core/rate-limit.ts`, fallback in-memory): auth 15/5 menit; RSVP/buku tamu/ucapan 30/menit; API lain 120/menit; webhook pembayaran dikecualikan.
- Security headers di `next.config.ts`: CSP (frame-ancestors `none` + X-Frame-Options `DENY` khusus `/admin` & `/dashboard`), HSTS, nosniff, Referrer-Policy, Permissions-Policy. Escape hatch: `RATE_LIMIT_ENABLED=false`.

## 6b. Smoke test beban & monitoring
- k6 smoke: `Get-Content -Raw scripts\smoke-k6.js | docker run -i --rm --add-host=host.docker.internal:host-gateway -e BASE_URL=http://host.docker.internal:3000 grafana/k6 run -`
  (threshold: error <1%, p95 <2 detik; mencakup landing, undangan, OG image, sitemap, robots). Terakhir lulus: 780/780 checks, p95 ~208 ms.
- Monitoring produksi (minimal): uptime check HTTP `/` + `/i/<slug contoh>` tiap 1 menit (UptimeRobot/Better Stack), alert jika >1 gagal berturut-turut; disk & memori VPS (node_exporter/cron df).
- Log: server Node log ke stdout (systemd/pm2); rotasi log OS. Error aplikasi ter-`console.error` — kumpulkan via jurnal + `audit_logs` untuk aksi sensitif.
- Regresi berkala: Lighthouse (SEO & a11y ≥95) + `scripts/restore-test.ps1` minimal sebelum rilis besar.
