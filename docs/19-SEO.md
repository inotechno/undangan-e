# 19 — Strategi SEO

Kebutuhan pemilik: **aplikasi harus SEO friendly.** Prioritas: landing & galeri (akuisisi organik) + halaman undangan (dibagikan & terindeks).

## 1. Prinsip render
- Halaman publik (`/`, `/template`, `/harga`, `/faq`, `/panduan`) dan undangan `/i/[slug]` → **Server-Side Rendering** (HTML nyata, bukan SPA kosong).
- Area privat (`/app`, `/admin`, `/kelola`) → `robots: noindex` + `X-Robots-Tag`.
- Template first-party dirender SSR penuh (bukan iframe) → konten undangan terindeks.

## 2. Metadata (Next.js Metadata API)
Per-route `generateMetadata`:
- **Landing**: title "UndanganE — Buat Undangan Digital Gratis & Modern", description mengandung "undangan digital", "undangan pernikahan online", "RSVP", dll.
- **Galeri**: `/template` — title + description kategori; `/template?kategori=pernikahan` → canonical ke filter.
- **Template detail**: `/template/[slug]` — deskripsi unik + preview image.
- **Undangan** `/i/[slug]` — dari `config.seo`:
  - `title`: "Undangan Pernikahan Budi & Sari — 12 Oktober 2026" (atau sesuai event_type)
  - `description`: kutipan + tanggal + kota
  - `openGraph`: title, description, images (OG image cover), type `website`, locale `id_ID`
  - `twitter: card=summary_large_image`
  - `alternates.canonical`: URL final (dengan `?kepada` **tidak** masuk canonical; canonical = URL polos slug)
- Template wajib mengisi `seo_title`/`seo_description` saat edit; jika kosong → fallback generatif dari data event.

## 3. Sitemap & robots
- `app/sitemap.ts`: landing, kategori, semua `/template/[slug]` aktif, semua `/i/[slug]` status `active`.
- `app/robots.ts`: izinkan `/`, `/template`, `/harga`, `/faq`, `/panduan`, `/i/`; larang `/app/`, `/admin/`, `/kelola/`, `/api/`.
- Sitemap update otomatis (ISR/revalidate 1 jam atau regen saat publish).

## 4. Structured data (JSON-LD)
- Landing: `Organization` + `WebSite` (+ `SearchAction` galeri).
- `/template/[slug]`: `Product`/`CreativeWork` ringan (nama, kategori).
- `/i/[slug]`: **`Event`** — name, startDate, location (venue, address), image, organizer (couple/host). Untuk ulang tahun/aqiqah tetap `Event`.
- FAQ page: `FAQPage`.

## 5. On-page
- Heading hierarki 1×H1 per halaman; H1 landing = proposisi nilai.
- Gambar: `next/image` + `alt` deskriptif (nama template/acara) + prioritas LCP (cover undangan `priority`).
- Internal link: landing → galeri → kategori → template; footer lengkap; CTA konsisten.
- Bahasa `id` pada `<html lang="id">`; hreflang disiapkan bila nanti tambah `/en`.

## 6. Performa (Core Web Vitals = ranking)
- Cover undangan: WebP/AVIF, ukuran ≤200KB, dimensi eksplisit (anti-CLS).
- Font: subset, `next/font`, display swap; hindari lebih dari 2 family.
- Musik/galeri lazy (tidak memblokir LCP).
- Target: LCP < 2.5s, CLS < 0.1, INP < 200ms (anggaran CI di `14`).

## 7. Halaman undangan: keputusan konten
- Yang selalu di HTML (terindeks): nama acara, tanggal, lokasi, pengantin/host, deskripsi.
- Interaktif (RSVP, QR, buku tamu) = client components setelah HTML; tidak menghalangi crawl.
- Personalisasi `?kepada=` tidak mengubah konten utama → tidak ada risiko cloaking.

## 8. Checklist rilis SEO
- [ ] `<title>` & meta description unik tiap route publik
- [ ] OG image valid (1200×630) tiap undangan aktif & template
- [ ] Sitemap berisi slug aktif; robots benar
- [ ] JSON-LD lolos Rich Results Test (Event, FAQ, Organization)
- [ ] Canonical benar (tanpa duplikat `?kepada`/`?g`)
- [ ] `/app`, `/admin`, `/kelola` noindex
- [ ] Lighthouse SEO ≥ 95 (landing & 1 undangan contoh)
- [ ] Gambar alt terisi; H1 tunggal

## 9. Di luar aplikasi (pasca rilis)
Google Search Console + Bing; submit sitemap; pantau CTR query "undangan digital + kota"; landing panduan (`/panduan/buat-undangan-pernikahan-online`) sebagai konten organik tahap awal.
