# 03 — Model Data (ERD, Tabel, Indeks)

PostgreSQL + Drizzle. PK `uuid` default `gen_random_uuid()`, `timestamptz`, uang **integer IDR**. JSONB hanya untuk config tervalidasi Zod.

## ERD (ringkas)

```
users ──< user_roles >── roles
users ──< invitations >── template (catalog rows) ── categories
invitations ──< guests ──< check_ins
invitations ──< manage_tokens
invitations ──< guestbook_entries
invitations ──< orders ──< payment_attempts ──< payment_events
orders >── vouchers (nullable)
pricing_rules (per account_type)
users ──< media_assets
settings ; audit_logs
── FASE NANTI (kontributor) ──
templates ──< template_versions ──< submissions ──< review_actions
template_versions ──< earning_ledger >── payouts
```

> Catatan MVP: karena template **internal**, tabel `templates`/`template_versions` tetap dibuat (katalog + versi visual), tetapi proses submit/approval kontributor dijalankan nanti. Kolom `bundle_key` dikosongkan untuk first-party.

## Tabel utama

### users & auth
- `users`: `id`, `email` UNIQUE, `name`, `phone`, `type` enum(`user`,`reseller`,`contributor`), `status` enum(`active`,`suspended`), timestamps.
- `user_roles`: UNIQUE(`user_id`,`role`) — role enum(`user`,`reseller`,`contributor`,`admin`). **Pendaftaran selalu memberi `user`**; role `reseller` hanya ditambahkan oleh sistem saat order `kind=reseller_upgrade` berstatus `paid` (atau admin manual untuk kasus koreksi; selalu audit).
- Tabel auth sesuai Better Auth (`sessions`, `accounts`, `verifications`).

### settings & pricing & vouchers
- `settings`: `key` PK, `value` JSONB, `updated_by`, `updated_at`. Contoh key: `guest.auto_create.per_ip_per_hour=10`, `guest.max_per_invitation=1000`, `invitation.default_validity_days=365`, **`reseller.upgrade_price_idr=50000`** (biaya upgrade sekali bayar, admin-configurable), `reseller.upgrade_enabled=true`, **`payment.fee_percent`** (default 0.7 — MDR), **`payment.fee_borne_by_buyer`** (default false), **`payment.tax_percent`** (default 11 — PPN), **`payment.tax_borne_by_buyer`** (default false; fee & pajak dikonfigurasi admin di `/admin/settings`).
- `pricing_rules`: `account_type` enum(`user`,`reseller`), `amount_idr` int >0, `active` bool, `effective_from`, `created_by`. Hanya **satu baris aktif per account_type** (partial unique index).
- `vouchers`: `id`, `code` UNIQUE (uppercase), `type` enum(`percent`,`nominal`), `value` int (persen 1–100 atau rupiah), `max_discount_idr` NULL (batas potongan untuk percent), `min_order_idr` default 0, `applies_to` enum(`all`,`user`,`reseller`), `max_total_uses` NULL = tanpa batas, `used_count` int default 0, `max_uses_per_user` NULL, `valid_from`, `valid_until` NULL, `active` bool, `created_by`, timestamps.

### katalog template
- `categories`: `slug` UNIQUE, `name_id`, `sort`, `active`.
- `templates`: `id`, `slug` UNIQUE, `name`, `category_id` FK, `description`, `preview_image_key`, `style_tags` text[], `status` enum(`active`,`hidden`), `sort`, `variant_group` NULL.
- `template_variants`: `id`, `template_id` FK, `name` (mis. "Palet Sage"), `theme_tokens` JSONB (warna/font override), `active`. (Memperbanyak pilihan katalog tanpa menggandakan kode layout.)

### invitations
- `invitations`: `id`, `owner_id` FK, `reseller_id` NULL FK, `customer_name` NULL, `customer_selling_price_idr` NULL, `template_id` FK, `template_variant_id` NULL, `slug` UNIQUE (polos alfanumerik), `event_type` (dari kategori), `status` enum(`draft`,`awaiting_payment`,`active`,`expired`,`archived`), `config` JSONB tervalidasi `InvitationConfigSchema` (couple/host/celebrant, jadwal multi-acara, teks, galeri, hadiah, musik, visibilitas section, tema), `published_at`, `expires_at`, `created_at`, `updated_at`, `deleted_at` NULL.
- `config` wajib memuat data SEO: `seo_title`, `seo_description`, `cover_image_key`.

### guests & check-in
- `guests`: `id`, `invitation_id` FK ON DELETE CASCADE, `name`, `name_normalized` (lower, spasi dirapikan), `phone` NULL, `group_name` NULL, `quota` int default 1 CHECK ≥1, `rsvp` enum(`pending`,`attending`,`declined`), `source` enum(`import`,`manual`,`link`,`form`), `guest_code` (kode pendek unik untuk URL `?g=`), `qr_hash` UNIQUE, `checked_in_at` NULL, `checked_in_by` NULL, `created_at`. Index: (`invitation_id`), (`invitation_id`,`name_normalized`), (`guest_code`) UNIQUE.
- `check_ins`: append-only — `id`, `guest_id`, `invitation_id`, `scanned_at`, `actor` enum(`owner`,`manage_token`,`staff`), `result` enum(`success`,`duplicate`,`invalid`).

### link kelola
- `manage_tokens`: `id`, `invitation_id` FK, `token_hash` UNIQUE (SHA-256), `label`, `scope` enum(`owner`,`customer`), `created_by`, `last_used_at`, `revoked_at` NULL.

### buku tamu
- `guestbook_entries`: `id`, `invitation_id`, `name`, `message` (max 500 char), `status` enum(`visible`,`hidden`), `created_at`.

### pesanan & pembayaran
- `orders`: `id`, **`kind` enum(`invitation`,`reseller_upgrade`)**, `owner_id`, `invitation_id` NULL FK (hanya untuk kind=invitation), `account_type`, `unit_price_idr` (snapshot: `pricing_rules` untuk invitation; `settings.reseller.upgrade_price_idr` untuk reseller_upgrade), `voucher_id` NULL FK, `voucher_code` NULL, `discount_amount_idr` default 0, `final_amount_idr` (= unit − discount, CHECK ≥ 0), **snapshot rincian biaya**: `fee_percent` numeric default 0, `fee_amount_idr` default 0, `fee_borne_by_buyer` bool default false, `tax_percent` numeric default 0, `tax_amount_idr` default 0, `tax_borne_by_buyer` bool default false, **`payable_amount_idr`** (total yang dibayar pembeli = final + fee/pajak yang dibebankan; CHECK ≥ 0; = nilai yang dikirim ke Duitku), `customer_selling_price_idr` NULL (bookkeeping reseller), `status` enum(`created`,`awaiting_payment`,`paid`,`cancelled`,`expired`,`refunded`), `idempotency_key` UNIQUE, `created_at`, `paid_at` NULL.
  - Fee & pajak **dihitung saat order dibuat/diubah** (pemasangan voucher) dari `settings` admin; perubahan tarif hanya berlaku order berikutnya. Fee/pajak dihitung dari `final_amount_idr` (setelah diskon).
  - Order `kind=reseller_upgrade` **tidak memakai voucher** (validasi: `voucher_id IS NULL` CHECK).
  - Saat webhook `paid` untuk `kind=reseller_upgrade`: INSERT `user_roles(user, reseller)` ON CONFLICT DO NOTHING (idempoten) + audit `reseller.upgraded`. Saat refund dengan opsi cabut: hapus role reseller + audit.
- `payment_attempts`: `id`, `order_id`, `provider` default `duitku`, `provider_ref` (reference Duitku), `status` enum(`pending`,`succeeded`,`failed`,`expired`,`refunded`), `qr_string` NULL (cache), **`payment_url` NULL** (halaman bayar Duitku), **`channel` NULL** (kanal QRIS dipakai: `NQ`/`SP`), **`amount_idr` NULL** (nominal inquiry), `expires_at`, `raw_last` JSONB (**backup lengkap response inquiry Duitku**: merchantCode, reference, paymentUrl, qrString, amount, statusCode, statusMessage). UNIQUE(`provider`,`provider_ref`).
- `payment_events`: inbox webhook — UNIQUE(`provider`,`event_id`), `payload` JSONB, `received_at`, `processed_at` NULL. Idempotensi: `INSERT … ON CONFLICT DO NOTHING`.

### audit
- `audit_logs`: `actor_id` NULL, `action` (string, mis. `voucher.create`, `price.change`, `checkin.success`), `entity`, `entity_id`, `meta` JSONB, `ip`, `created_at`.

### media
- `media_assets`: `id`, `owner_id`, `key` (R2), `mime`, `bytes`, `sha256`, `purpose` enum(`invitation`,`avatar`,`template_preview`), `scan_status`.

## State machine (ringkas)
- `invitation`: draft → awaiting_payment → active → expired → archived.
- `order`: created → awaiting_payment → paid → (refunded) | expired | cancelled. (berlaku untuk kind invitation & reseller_upgrade)
- `payment_attempt`: pending → succeeded | failed | expired → refunded.
- `reseller upgrade`: user ─(buat order kind=reseller_upgrade)→ awaiting_payment ─(webhook paid)→ role reseller granted ─(refund+cabut, opsional)→ role dicabut.

## Indeks kritis
`invitations(owner_id)`, `invitations(slug) UNIQUE`, `invitations(status)`, `guests(invitation_id)`, `guests(guest_code) UNIQUE`, `orders(owner_id)`, `orders(invitation_id)`, `payment_attempts(order_id)`, `payment_events UNIQUE(provider,event_id)`, `vouchers(code) UNIQUE`, `audit_logs(created_at)`, `audit_logs(entity,entity_id)`. Partial index `pricing_rules` aktif per `account_type`.

## Integritas anti-duplikat (di DB, bukan aplikasi)
- Satu voucher maksimal sekali dipakai per order (`orders.voucher_id`).
- Redeem voucher: `UPDATE vouchers SET used_count = used_count + 1 WHERE id=$1 AND active AND (max_total_uses IS NULL OR used_count < max_total_uses) AND now() BETWEEN valid_from AND COALESCE(valid_until, now()) RETURNING *` — atomik; 0 baris = voucher tidak valid/kuota habis.
- Pembayaran ganda: unique `payment_events(provider,event_id)` + lock row order saat transisi status.
