# 05 — API, Server Action & Alur State

## 1. Konvensi
- Mutasi dalam aplikasi → **Server Actions** (input Zod, auth di dalam action).
- Publik/webhook/undangan → **Route Handlers**.
- Semua handler: validasi Zod → auth/token → query ber-scope → mutasi → `audit_logs` bila aksi sensitif.

## 2. Route & action penting

### Publik (SEO, no auth)
- `GET /` , `/template`, `/template/[slug]`, `/harga`, `/faq`, `/panduan` — SSR + metadata.
- `GET /i/[slug]` — SSR undangan (projection publik; `?kepada=`, `?g=` untuk konteks tamu — `10`).
- `POST /api/public/i/[slug]/rsvp` — update RSVP konteks tamu (rate-limit + honeypot).
- `POST /api/public/i/[slug]/buku-tamu` — pesan buku tamu (moderasi `status`).

### Auth
- `POST /api/auth/*` (Better Auth): daftar, masuk, lupa sandi, sesi.

### Aplikasi (session)
- Invitations: `GET/POST /api/invitations`, `GET/PATCH/DELETE /api/invitations/[id]`, `POST .../publish`, `POST .../unpublish`.
- Editor: autosave config (PATCH bertahap, debounce), `POST .../media` (upload R2).
- Tamu: `GET/POST /api/invitations/[id]/guests`, import CSV/XLSX, `POST .../guests/[gid]/qr`, delete.
- Check-in: `POST /api/checkin` body `{ qrPayload }` (owner/manage-token).
- Pesanan: `POST /api/orders` (snapshot harga + **redeem voucher atomik**), `GET /api/orders/[id]`, `POST /api/orders/[id]/pay` → inquiry Duitku, `GET /api/orders/[id]/status` (poll dari DB; fallback terbatas ke Duitku).
- Voucher: `POST /api/vouchers/validate` (cek tanpa redeem, untuk UI checkout).
- **Upgrade reseller**: `POST /api/reseller/upgrade` (cetak order `kind=reseller_upgrade` dari `settings.reseller.upgrade_price_idr`, tanpa voucher) → `POST /api/orders/[id]/pay` (alur QRIS sama); `GET /api/reseller/upgrade/status`.
- Kelola: `GET /api/manage/[token]/guests`, `POST /api/manage/[token]/checkin` (scope undangan token).

### Webhook
- `POST /api/webhooks/payment/duitku` — verifikasi HMAC-SHA256 (`merchantCode+amount+merchantOrderId`) → inbox `payment_events` idempoten → transisi order → aktifkan undangan.

### Admin
- `/api/admin/users`, `/admin/pricing` (ubah harga aktif), `/admin/vouchers` (CRUD), `/admin/orders`, `/admin/payments`, `/admin/invitations`, `/admin/categories`, `/admin/settings`, `/admin/audit` — semua `requireRole('admin')`.

## 3. State machine

### Undangan
```
draft ──(order paid)──► active ──(expires_at lewat)──► expired ──► archived
  │                        │                                │
  └──(batal bayar)──► draft│                                └──(bayar ulang/reactivate)──► active
```
Publikasi hanya terjadi **setelah** `order.status=paid` terverifikasi server (redirect browser bukan sumber kebenaran).

### Pesanan
```
created ─► awaiting_payment ─► paid ─► refunded (admin)
                │
                ├──► expired   (waktu inquiry habis)
                └──► cancelled (user batal)
```

### Percobaan bayar
```
pending ─► succeeded | failed | expired ─► refunded
```

### Transisi webhook (sinkron)
1. `INSERT payment_events (ON CONFLICT DO NOTHING)` → jika conflict: balas 200, selesai.
2. `SELECT … FOR UPDATE` order.
3. Validasi signature + `resultCode == "00"` → `paid`; selain itu catat `failed/expired`.
4. Efek `paid` per `kind`:
   - `invitation` → set undangan `active`, `published_at=now()`, `expires_at` = now + setting.
   - `reseller_upgrade` → INSERT `user_roles(user,'reseller')` ON CONFLICT DO NOTHING + audit `reseller.upgraded` (idempoten).
5. Audit + email notifikasi (antrean job di Redis).

## 4. Checkout dengan voucher (alur)
```
POST /api/vouchers/validate { code, invitationId }  → { ok, discount, final }   (tanpa redeem)
POST /api/orders { invitationId, idempotencyKey, code? }
  1. price = pricing_rules[account_type actor]        (server)
  2. if code: atomik redeem voucher (cek applies_to, masa berlaku, min_order, kuota, per-user)
  3. INSERT order (unit_price, discount, final_amount) + payment_attempt
  4. DuitkuProvider.createInvoice(final_amount, qr)    (paymentAmount = final_amount)
  5. redirect /bayar/[orderId] → tampilkan QR + countdown
```
- Harga yang dikirim ke Duitku = `final_amount_idr` **setelah diskon**.
- `final_amount_idr` tetap harus ≥ Rp10.000 (limit Duitku) — validasi saat redeem.

## 5. Idempotensi & kegagalan
- `orders.idempotency_key` dari client (UUID per sesi checkout) — klik ganda tidak membuat order ganda.
- Webhook duplikat/out-of-order: ditentukan unique event + lock order; status hanya maju (paid tidak kembali ke awaiting).
- Jika inquiry Duitku gagal setelah order dibuat: order `created`/`awaiting_payment` tanpa `provider_ref`; user bisa klik "Bayar lagi" (re-inquiry, attempt baru).

## 6. Rate limiting
- Andalan: **Redis** (token bucket per key: IP, email, undangan) — tahan bila nanti multi-instance; fallback in-memory bila Redis down.
- Publik (rsvp, buku tamu, auto-create tamu): per IP + per undangan.
- Login: per email/IP.
- Admin API: longgar (sesi admin).
