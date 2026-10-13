# 18 — Sistem Desain Aplikasi (Brand-Driven, Minimal, Modern)

Kebutuhan pemilik: **jangan banyak warna, modern, sesuai brand yang sudah dibuat.**

## 1. Sumber brand (tidak diubah)
Dari `brand/tokens.css` & `brand/README.md`:
- `--brand-teal: #0D9488` — aksen utama (CTA, link, highlight). Emerald teal, fresh & modern.
- `--brand-charcoal: #373C3F` — teks utama
- `--brand-black/white` — monokrom
- Font brand: **Montserrat** (wordmark sudah outline; untuk UI headings boleh Montserrat)
- Aturan logo: tanpa gradient/shadow/glow; clear space; varian mono sesuai latar

## 2. Prinsip UI
1. **Monokrom + satu aksen** — teal hanya untuk aksi & penekanan; jangan dominan.
2. **Tanpa gradient, tanpa glow** (ikuti aturan brand).
3. Spasi lega, hierarki tipografi jelas, radius kecil-menengah, bayangan halus sekali.
4. Modern-minimal: border tipis netral, card putih di latar warm-neutral, ikon stroke sederhana (Lucide).
5. Mobile-first; target pengguna awal membuka dari HP.

## 3. Palet UI (warm neutral)

| Token | Hex | Pemakaian |
|---|---|---|
| `bg` | `#FAF8F6` | Latar aplikasi (warm neutral, sedikit krem) |
| `surface` | `#FFFFFF` | Card, form, tabel |
| `border` | `#E9E4DF` | Garis tipis |
| `text` | `#373C3F` | Teks utama (charcoal brand) |
| `muted` | `#8A847E` | Teks sekunder, placeholder |
| `accent` | `#0D9488` | Tombol utama, link aktif, fokus |
| `accent-hover` | `#0A7A70` | Hover CTA (gelap 8%) |
| `accent-soft` | `#E6F5F2` | Badge/latar aksen lemah |
| `success` | `#3F7D5C` | Status sukses (hijau doff, bukan neon) |
| `warning` | `#A67C2E` | Peringatan |
| `danger` | `#B23A48` | Error/hapus |
| `dark-panel` | `#2C3033` | (opsional) sidebar gelap — hanya bila konsisten |

Aturan: maksimal **1 warna aksen** terlihat per layar; status warna hanya sebagai teks+ikon kecil.

## 4. Tipografi
- **UI**: `Plus Jakarta Sans` atau `Inter` (400/500/600) — bersih, modern; fallback sistem.
- **Heading sesekali**: Montserrat 600 (kaitan visual ke wordmark).
- Skala: 12/14/16/18/20/24/30/36; line-height longgar untuk body (1.6).
- Angka rupiah: format `Rp15.000` (id-ID, titik ribuan).

## 5. Komponen dasar (shadcn/ui, di-sesuaikan)
- Button: primary = solid teal, text putih; secondary = outline netral; ghost; destructive = danger.
- Input: border `#E9E4DF`, fokus ring teal 2px transparan.
- Card: `surface` + border + radius 12 + shadow `0 1px 2px rgb(0 0 0 / 0.04)`.
- Badge status: soft bg netral/teal/success sesuai makna, teks 12px.
- Tabel admin: header muted uppercase 12px, baris compact, hover halus.
- Toast: netral + ikon; sukses pakai success.

## 6. Layout
- **App shell**: sidebar kiri (ringkas, ikon+label) di desktop; bottom/tab di mobile. Item menu mengikuti `01` (Undangan, Template, Tamu, Pesanan, Pengaturan).
- **Admin**: sidebar + tabel padat; hindari "kartu promosi"; filter bar di atas tabel; drawer detail kanan.
- **Editor**: split kiri form / kanan preview (preview sticky); di mobile: tab "Edit | Preview".
- **Public**: landing satu kolom, hero singkat dengan logo + 1 CTA teal; galeri grid 2–3 kolom; footer gelap charcoal.

## 7. Motion
Cubic-bez 150–200ms; fade/slide kecil; hormati `prefers-reduced-motion`. Animasi "wah" hanya di **undangan** (produk), bukan di aplikasi.

## 8. Aksesibilitas
Kontras teks charcoal/bg lolos AA; fokus keyboard terlihat (ring teal); target sentuh ≥44px; label form; alt gambar.

## 9. Tema undangan vs tema aplikasi
- UI aplikasi: mengikuti dokumen ini (terbatas, brand).
- Template undangan: **boleh kaya warna & animasi** (itu produk yang dijual), tetap dengan token kontras aman (`06`).

## 10. Aset logo
Salin per `brand/README.md` §8: SVG → `public/brand/logo/`, PNG → `public/brand/png/`; komponen `<UndanganELogo variant size>` dari `brand/generated/logo-paths.ts` (inline SVG, `currentColor` untuk varian mono). Favicon & app-icon dari brand PNG. Jangan menggambar ulang logo.
