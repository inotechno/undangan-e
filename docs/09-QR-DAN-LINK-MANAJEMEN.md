# 09 — QR Tamu & Link Manajemen Privat

## 1. QR tamu
- Payload: token opaque `v1.<guestCode>` + HMAC-SHA256 singkat (secret `QR_HMAC_SECRET`) — **tanpa PII** di dalam QR.
- Disimpan: `guests.qr_hash` (hash payload); generate ulang idempoten dari `guest_code`.
- Output: PNG/SVG via lib `qrcode` di server; tampil di (a) halaman tamu ("QR kehadiran Anda"), (b) daftar tamu pemilik (per tamu / unduh massal PDF opsional fase lanjut).
- Scanner: halaman check-in milik pemilik/pegangan token kelola; `@zxing/browser` (kamera, HTTPS wajib) + fallback ketik kode manual.

## 2. Alur check-in
```
Owner/kelola buka /app/undangan/[id]/checkin  (atau via /kelola/[token]/checkin)
  → scan QR tamu
  → POST /api/checkin { payload }
Server:
  1. verifikasi HMAC payload
  2. resolve guest + pastikan guest.invitation_id == konteks undangan (scope!)
  3. cek checked_in_at IS NULL (row lock)
  4. sukses → update guests + INSERT check_ins(result=success)
     duplikat → 409 + pesan jelas "Sudah check-in pukul HH:MM" + INSERT check_ins(result=duplicate)
     tidak valid/salah undangan → 404/403 + log result=invalid
```
- QR tamu **bukan** kredensial pemilik: payload tidak memberi akses kelola apa pun.

## 3. Link kelola privat (`/kelola/[token]`)
- Token: 32 byte CSPRNG → base32url (contoh: `kla_9f3a…`); DB simpan **SHA-256** saja; plaintext sekali saat dibuat (+opsional QR sendiri).
- Satu token = satu undangan; `scope` `owner`|`customer`; label (mis. "Pelanggan: Bu Rina").
- Kapabilitas: lihat daftar tamu (nama, grup, RSVP, check-in), check-in, (opsional) export CSV — **tidak** melihat order, harga jual, data reseller lain, atau edit konten.
- Multi-token per undangan → cabut/regenerasi per penerima tanpa mengganggu yang lain (`revoked_at`).
- Rate limit per token+IP; `last_used_at` + audit.

## 4. Kebijakan (sesuai keputusan pemilik)
| Aspek | Keputusan |
|---|---|
| Kedaluwarsa default | Tidak kedaluwarsa (terikat umur undangan); admin bisa set TTL via settings |
| Transferable | Ya — memang untuk dibagikan pelanggan; risiko dimitigasi dengan cabut/regenerasi |
| PIN opsional | Toggle per token (default mati; nyalakan untuk acara sensitif) |
| Enkripsi at rest | Hash saja (token acak 256-bit tidak perlu dienkripsi) |

## 5. Model tamu di sistem
- `guests.source`: `import` (CSV/XLSX), `manual` (input pemilik), `link` (auto-create dari URL — `10`), `form` (form nama di halaman undangan).
- Impor: deteksi duplikat normalisasi nama per undangan; laporan baris gagal; batas 1000 baris/file.
- Kuota (`quota`) menentang over-counting RSVP; check-in menghormati `quota` (1 tamu bisa membawa N orang → status check-in per-tamu, jumlah hadir = akumulasi quota saat attending — detail implementasi di kode).
