# 10 — Akses Tamu via URL (auto-create tamu)

Kebutuhan pemilik: *tamu bisa diakses lewat URL; jika URL merujuk tamu yang tidak terdaftar → buat tamu baru.*

## 1. Bentuk URL
| URL | Sumber | Makna |
|---|---|---|
| `/i/[slug]` | generik | Tanpa konteks → form nama |
| `/i/[slug]?kepada=Nama%20Tamu` | blast WhatsApp (tanpa impor) | Nama di query |
| `/i/[slug]?g=<guest_code>` | link personal dari daftar tamu | Kode tamu |

## 2. Alur resolusi (server, saat load `/i/[slug]`)
```
1. cookie guest_ctx valid (HMAC, invitation-scoped)?  → pakai tamu tsb
2. ?g= ada:
     - guest_code dikenal di undangan ini?  → bind (set cookie)
     - tidak dikenal?                      → buat tamu baru (source=link, name="Tamu", code baru)
       (opsi setting: tolak vs buat baru — default BUAT BARU sesuai permintaan pemilik)
3. ?kepada= ada:
     - normalisasi nama → ada baris sama? → bind tamu lama (hindari duplikat)
     - tidak ada?                          → CREATE tamu baru (source=link, quota default)
4. tanpa parameter:
     - tampilkan cover + form "Nama Anda" (wajib) → logika bind/create sama (source=form)
5. set cookie HttpOnly signed: { guestId, invitationId } → expiry = akhir acara + 30 hari
```
Setelah bind, tamu melihat: undangan personal, RSVP miliknya, **QR kehadiran** (dibuat saat pertama kali dibuka), dan pesan buku tamu terkait namanya.

## 3. Anti-spam & batas (keputusan pemilik)
| Kontrol | Nilai default (setting) |
|---|---|
| Auto-create per IP per jam | 10 |
| Total tamu per undangan | 1000 |
| Form nama | wajib, min 2 char, max 60, honeypot field, rate-limit 5/jam/IP |
| Nama | normalisasi (lowercase, spasi, trim); duplikat → bind, bukan create |
| Audit | semua create/bind masuk log (actor=public, meta ip+slug) |
| Saat limit tercapai | pesan ramah "undangan penuh" + tetap tampil konten publik |

## 4. Privasi & keamanan
- `guest_code` = acak (bukan sequential id) → menebak sulit.
- Cookie context hanya membuka data tamu sendiri; tidak pernah daftar tamu lain.
- Projection publik undangan tidak memuat data pemilik sensitif (no phone, no rekening selain yang memang ditampilkan fitur gift).
- `?kepada=` tidak dianggap otentikasi — hanya label; tamu tetap bisa diganti via form nama (setting: "boleh ganti nama" default ya).

## 5. Dampak modul lain
- Daftar tamu pemilik: badge sumber (`link`/`form`) + filter.
- RSVP count & progress bar otomatis mengikuti tamu auto-create.
- Check-in: tamu auto-create langsung punya QR sah (`09`).
- SEO: tidak ada efek — konteks tamu hanya mempengaruhi bagian interaktif; HTML utama tetap sama (lihat `19`).
