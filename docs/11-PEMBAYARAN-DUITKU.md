# 11 — Pembayaran Duitku (QRIS only, akun individual) + Voucher

## 1. Status
- Pemilik **sudah memiliki akun Duitku** (individual). Kredensial diisi di `.env`, bukan di repo.
- Aktivasi: login passport.duitku.com → buat **project** → ambil `merchantCode` & `apiKey` (sandbox dulu: `sandbox.duitku.com`).
- QRIS untuk akun individual: otomatis terdaftar saat buka akun Duitku (verifikasi KTP). Settlement **D+2**. MDR QRIS individu **wajib dikonfirmasi ke Duitku** (asumsi perencanaan ~0.7%).

## 2. Env
```
DUITKU_MERCHANT_CODE=
DUITKU_API_KEY=
DUITKU_QRIS_CODE=           # opsional: paksa kanal QRIS tertentu (default kosong → NQ utama, SP fallback)
DUITKU_SANDBOX=true        # false di produksi
DUITKU_CALLBACK_URL=https://app.<domain>/api/webhooks/payment/duitku
DUITKU_MIN_AMOUNT_IDR=10000

# Pengembangan (runtime, opsional)
DUITKU_FORCE_DUMMY=true        # mode dummy: QR simulasi, signature HMAC pakai "dummy-api-key"
ALLOW_PAYMENT_SIMULATION=true  # aktifkan POST /api/dev/simulate-payment + tombol simulasi di /bayar
AUTH_RATE_LIMIT=false          # matikan rate-limit bawaan Better Auth (uji lokal saja)
```
Mode dummy otomatis aktif bila `DUITKU_MERCHANT_CODE`/`DUITKU_API_KEY` kosong. Invoice dummy tidak memanggil jaringan; webhook tetap memverifikasi HMAC sungguhan (dengan key dummy).

## 3. API v2 yang dipakai
| Fungsi | Endpoint | Catatan |
|---|---|---|
| Buat tagihan (inquiry) | `POST {base}/webapi/api/merchant/v2/inquiry` | `paymentMethod` = **NQ (Nobu QRIS) utama**, fallback **SP (ShopeePay QRIS)** bila NQ `404 Payment channel not available` |
| Get payment methods | `POST {base}/webapi/api/merchant/paymentmethod/getpaymentmethod` | opsional, untuk cek kanal QRIS aktif (`signature = HMAC(merchantcode+amount+datetime)`) |
| Check status | API check status | **jangan di-spam** (rate limit ~1 jam block); hanya fallback |
| Callback (IPN) | POST ke `DUITKU_CALLBACK_URL` | dari server Duitku |

Signature (MD5 obsolete — gunakan HMAC-SHA256, hex lowercase):
- **Inquiry**: `HMAC_SHA256(merchantCode + merchantOrderId + paymentAmount, apiKey)`
- **Callback**: `HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)`

Field inquiry penting: `merchantOrderId` (unik, ≤50 char, = our `order.id` string), `paymentAmount` (int IDR = **`orders.payable_amount_idr`** — total yang benar-benar dibayar pembeli), `productDetails`, `email` (wajib), `customerVaName`, `callbackUrl`, `returnUrl`, `expiryPeriod` (5|10|60 menit — pakai 60), `signature`.

Response: `reference` (simpan ke `payment_attempts.provider_ref`; inquiry ulang dengan `merchantOrderId` sama → reference sama, jadi attempt lama di-**update**, bukan insert ulang), `qrString` (kolom `payment_attempts.qr_string`), `paymentUrl` (kolom `payment_attempts.payment_url` → tombol "Buka Halaman Pembayaran"), kanal dipakai → kolom `payment_attempts.channel`, nominal → `payment_attempts.amount_idr`, dan **response lengkap di-backup ke `payment_attempts.raw_last` (JSONB)**.

Catatan kanal (sandbox `DS36281`): `getpaymentmethod` hanya melaporkan **NQ** aktif; `SP` di inquiry bisa `404 Payment channel not available`. Urutan percobaan di `duitku.ts`: `DUITKU_QRIS_CODE` (jika diisi) → `NQ` → `SP`.

Callback field: `merchantCode`, `amount`, `merchantOrderId`, `resultCode` (`00`=sukses), `reference`, `signature`, opsional `issuerCode`, `customerName`, `settlementDate`.

## 4. Alur aplikasi
```
[Checkout undangan] user input voucher (opsional) → POST /api/vouchers/validate → tampil potongan
[Order]     POST /api/orders (kind=invitation) → snapshot harga + fee/pajak + redeem voucher atomik
            → order dibuat TANPA tagihan (hasInvoice=false)
[Bayar]     halaman /bayar/[orderId] (2 kolom):
            · kiri  = rincian biaya (harga, diskon voucher, biaya layanan %, pajak %, total)
              + input voucher (ganti/hapus via POST/DELETE /api/orders/[id]/voucher —
              nominal berubah → attempt pending dibatalkan)
            · kanan = sebelum bayar: total + tombol "Bayar Sekarang";
              POST /api/orders/[id]/pay → issueInvoice (NQ, fallback SP) →
              QR tampil di halaman yang sama (countdown + paymentUrl + string QRIS)
            · order expired: tombol "Buat Tagihan Baru" → inquiry ulang (reference sama)
[Upgrade reseller] POST /api/reseller/upgrade (kind=reseller_upgrade, harga dari
           settings.reseller.upgrade_price_idr, TANPA voucher) → /bayar/[orderId] sama
[Poll]     client poll /api/orders/[id]/status tiap 5 dtk (baca DB)
           fallback server: query checkStatus Duitku maks 1x/15 dtk, maks 6x percobaan,
           setelah itu status "Menunggu konfirmasi" (callback akan datang)
[Callback] POST /api/webhooks/payment/duitku
           → verifikasi HMAC → INSERT payment_events (UNIQUE → idempoten)
           → lock order → paid
           → kind=invitation: undangan active + published_at
           → kind=reseller_upgrade: grant role reseller (ON CONFLICT DO NOTHING) + audit
           → audit + email (antrean Redis)
[Return]   returnUrl /bayar/[orderId]?return=1 → UI membaca status DB (bukan percaya redirect)
[Refund]   manual di dashboard Duitku → admin tandai refunded di app
           (invitation → archived; reseller_upgrade → opsi "cabut status reseller")
```

## 5. Voucher diskon (fitur baru — keputusan pemilik)
### Model
`vouchers` (lihat `03`): kode unik, tipe `percent`|`nominal`, value, `max_discount_idr` (batas potongan percent), `min_order_idr`, `applies_to` (`all`|`user`|`reseller`), `max_total_uses`, `used_count`, `max_uses_per_user`, `valid_from/until`, `active`.

### Perhitungan
```
discount = percent ? min(value% × unit, max_discount_idr ∞) : min(value, unit)
final    = max(unit − discount, 0)
fee      = round(final × payment.fee_percent / 100)   # default 0.7% (MDR)
tax      = round(final × payment.tax_percent  / 100) # default 11% (PPN)
payable  = final + (fee_borne_by_buyer ? fee : 0) + (tax_borne_by_buyer ? tax : 0)
validasi : final ≥ DUITKU_MIN_AMOUNT_IDR (10000)
         : applies_to cocok account_type pemesan
         : now() dalam [valid_from, valid_until]
         : kuota global & per-user cukup
```
Semua angka di-snapshot ke kolom `orders` (fee/tax/payable) — perubahan tarif admin tidak mengubah order lama. Fee/pajak yang **tidak** dibebankan ke pembeli tetap dicatat (untuk laporan) tapi tidak menambah `payable`. Admin ubah tarif & opsi beban di `/admin/settings` (PATCH `/api/admin/settings/payment`).
`paymentAmount` Duitku = `final`.

### Redeem atomik (anti double-spend)
```sql
UPDATE vouchers SET used_count = used_count + 1
WHERE id = $1 AND active
  AND (max_total_uses IS NULL OR used_count < max_total_uses)
  AND now() >= valid_from AND (valid_until IS NULL OR now() <= valid_until)
RETURNING *;
```
0 baris → checkout gagal dengan pesan spesifik. Percobaan order gagal setelah redeem (inquiry error) → `used_count - 1` kompensasi (atau hold-pattern: redeem saat `paid` — dipilih: redeem saat order dibuat + kompensasi batal, lebih sederhana & cukup aman dengan audit).

### UI checkout
- Kolom "Kode Voucher" + tombol "Pakai" → preview "Potongan RpX — Total RpY".
- Saldo berubah server-side saat klik Bayar (bukan hasil kalkulasi client).
- Pesan error ramah: kadaluwarsa, kuota habis, tidak berlaku untuk tipe akun, di bawah minimum.

### Admin
- CRUD voucher (`/admin/voucher`): buat, nonaktifkan, lihat `used_count`, riwayat pemakaian (join orders).
- Aksi masuk `audit_logs` (`voucher.create`, `voucher.disable`).

## 6. Idempotensi & kegagalan
- Webhook duplikat: unique `payment_events` + hanya proses sekali; balas 200 cepat.
- Out-of-order: status monoton (paid tidak mundur).
- Order awaiting lewat expiry: cron menandai `expired`; voucher dipakai dikembalikan (compensation) bila aturan expired.
- Klik bayar ganda: `orders.idempotency_key` client-side.
- Gagal inquiry: user bisa ulangi; attempt baru dengan reference baru.

## 7. Pengujian
- Sandbox Duitku: simulasi bayar sukses/gagal; mock callback dengan signature benar/salah (unit test formula HMAC).
- UAT: harga 15.000 − voucher 5.000 = 10.000 (pas minimum) → lolos; 15.000 − 10.000 = 5.000 → tolak.
- Lihat `14-PENGUJIAN.md`.

## 8. Catatan individual (pajak)
Penerimaan settlement ke rekening pribadi = penghasilan orang pribadi; kewajiban pajak (PPh) di luar sistem. Dicatat di `17-KEPUTUSAN-BISNIS.md`.
