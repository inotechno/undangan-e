# 06 — Invitation Engine & Katalog Template

## 1. Filosofi
Satu engine konfigurasi-driven. Tidak ada halaman hardcoded per template. Template = **komposisi section + palet/tema + gaya animasi** di atas komponen bisnis bersama → fungsi seragam (RSVP, QR, hadiah…), tampilan bervariasi.

## 2. Layer engine

### 2.1 Section registry (bisnis, dipakai semua template)
`cover`, `event_info`, `countdown`, `couple/host`, `gallery`, `story`, `schedule_maps`, `gift`, `rsvp`, `guestbook`, `qr_pass`, `wishes_list`, `closing`, `music_player`.
- Setiap section: props dari `InvitationConfig` + `ThemeTokens`; visibility diatur editor.
- Section publik yang butuh data tamu (`rsvp`, `qr_pass`) membaca konteks tamu (cookie/URL — `10`).

### 2.2 Theme tokens
`{ palette: {bg, surface, text, accent, accentSoft}, fonts: {heading, body}, radius, decorations: 'floral'|'geometric'|'ornament'|'none', motion: 'soft'|'playful'|'elegant' }`.
- Template menentukan default; user bisa mengubah **sebagian** (palet dalam palet yang diizinkan template, font dari daftar aman).
- Palet UI aplikasi sendiri mengikuti `18-BRAND.md` (terpisah dari palet undangan).

### 2.3 Layout families (struktur cover/scroll)
- `full_bleed` — foto penuh + scroll reveal.
- `curtain` — pembukaan gorden/amplop saat "Buka Undangan" (pattern Indonesia).
- `slider` — slide horizontal antar section.
- `frame_device` — bingkai perangkat (cocok untuk seminar/corporate).

### 2.4 Animasi
Framer Motion: scroll-reveal, parallax lembut, count-up, confetti canvas (ulang tahun), partikel kelopak/floral. Aturan: performa (transform/opacity only), reduksi gerak (`prefers-reduced-motion`) dihormati.

### 2.5 Musik
- Autoplay diblokir browser → **cover gate** "Buka Undangan" menjadi gesture unlock audio.
- Kontrol play/pause mengambang; file dari R2 dengan preload metadata.

### 2.6 SEO engine
Setiap template wajib merender **HTML server-side**: judul, nama acara, tanggal, lokasi, deskripsi (lihat `19-SEO.md`). Section seperti story/gallery lazy-load tapi info utama tetap di HTML.

## 3. Workflow "pabrik template" (checklist per template)
1. Pilih kategori + layout family + gaya animasi signature (berbeda dari tetangganya).
2. Palet & font pairing sendiri (kontras lolos WCAG AA).
3. 2–4 varian palet opsional (`template_variants`).
4. Foto demo (Unsplash/self-shot) di R2 `template-previews/`.
5. Screenshot 375/768/1280 untuk katalog + card gallery.
6. Uji: countdown, musik, RSVP, gift, QR, peta, buku tamu pada 3 breakpoint.
7. Daftar ke `templates` + kategori; `status=active`.

## 4. Katalog target (24 template, 8 kategori)

| # | Slug | Kategori | Layout | Signature (anti-monoton) |
|---|---|---|---|---|
| 1 | `siraman-floral` | Pernikahan | curtain | Kelopak jatuh, ornamen floral SVG, palet blush |
| 2 | `modern-minimal` | Pernikahan | full_bleed | Tipografi besar, whitespace, monokrom + aksen |
| 3 | `royal-gold` | Pernikahan | full_bleed | Emas-doff, frame ornament, reveal lambat |
| 4 | `rustic-outdoor` | Pernikahan | full_bleed | Foto alam, tekstur kertas, parallax |
| 5 | `islamic-geometric` | Pernikahan | frame_device | Pola geometri islami, kaligrafi pembuka |
| 6 | `pastel-garden` | Pernikahan | curtain | Taman pastel, kupu animasi |
| 7 | `engagement-soft` | Tunangan | slider | Cincin SVG animasi, palette dusty |
| 8 | `ring-precision` | Tunangan | full_bleed | Mikro-interaksi cincin, tipografi tajam |
| 9 | `birthday-confetti` | Ulang Tahun | full_bleed | Confetti canvas, warna cerah terkontrol |
| 10 | `kids-cartoon` | Ulang Tahun | curtain | Maskot/ilustrasi, animasi playful |
| 11 | `milestone-retro` | Ulang Tahun | frame_device | Tema retro 80-an, polaroid gallery |
| 12 | `sweet-sixteen` | Ulang Tahun | slider | Gradient lembut (di template), bintang |
| 13 | `aqiqah-baby-pastel` | Aqiqah | curtain | Awan, bulan, bayi pastel |
| 14 | `aqiqah-gold-ornament` | Aqiqah | full_bleed | Ornament emas, tilawah audio opsional |
| 15 | `khitanan-playful` | Khitanan | curtain | Animasi bendera/warna ceria |
| 16 | `khitanan-traditional` | Khitanan | frame_device | Batik pattern, palet cokelat-emas |
| 17 | `family-gathering` | Keluarga | slider | Grid anggota keluarga interaktif |
| 18 | `reunion-classic` | Keluarga | full_bleed | Galeri kenangan tahunan |
| 19 | `arisan-warm` | Keluarga | frame_device | Kartu arisan, jadwal rotasi |
| 20 | `seminar-corporate` | Seminar | frame_device | Agenda, pembicara, CTA daftar |
| 21 | `webinar-tech` | Seminar | full_bleed | Countdown registrasi, badge virtual |
| 22 | `workshop-creative` | Seminar | slider | Papan sticky-note animasi |
| 23 | `syukuran-elegant` | Syukuran | curtain | Doa pembuka, ornamen tenang |
| 24 | `housewarming` | Syukuran | full_bleed | Tur rumah visual, galeri interior |

Pengembangan bertahap: **Batch 1 (Fase 4)** template #1–6; **Batch 2 (Fase 9)** #7–24 + varian palet. Setiap penambahan wajib lewat checklist §3.

## 5. Konfigurasi undangan (`config` JSONB — ringkas)
```
seo: { title, description, coverImageKey }
event: { type, couple|host|celebrant, schedules: [{title, start, end, venue, mapUrl, address}] }
story: [{ year, title, text, imageKey? }]
gallery: [{ imageKey, caption? }]
gift: { enabled, instructions, accounts: [{bank|ewallet, number, holder}] }
music: { trackKey, autoplayAfterOpen }
sections: { cover:true, story:false, ... }  // visibilitas
theme: { paletteId|custom, fontPairId, motion }
```

## 6. Versi & kompatibilitas
- Katalog internal: perubahan layout = perubahan kode + review visual regression.
- Struktur `template_variants` + `templates` dipertahankan agar ketika SDK kontributor aktif (fase nanti) tidak perlu migrasi katalog (`07`, `08`).
- Undangan terbit menempel `template_id` + varian; mengubah katalog tidak merusak undangan lama (hanya patch bug dengan screenshot diff).
