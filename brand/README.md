# UndanganE — Brand Asset System

Sumber kebenaran visual: **3 gambar referensi di `../logo/`** (icon, stacked, horizontal).
Aturan: tanpa redesign, tanpa gradient, tanpa shadow/glow/3D — flat vector, SVG-first, teks outline ke path.

---

## 1. Warna

| Token              | Hex       | Pemakaai                                        |
| ------------------ | --------- | ----------------------------------------------- |
| `--brand-rose`     | `#CC6470` | Ikon, letter **E** wordmark                     |
| `--brand-charcoal` | `#373C3F` | Wordmark "Undangan", tagline                    |
| `--brand-black`    | `#000000` | Varian monokrom gelap, watermark (opacity 0.15) |
| `--brand-white`    | `#FFFFFF` | Varian monokrom terang (latar gelap)            |

Detail lengkap: `tokens.json`, `tokens.css`.

## 2. Tipografi

- **Wordmark**: Montserrat **Bold** — `fonts/Montserrat-Bold.ttf`
- **Tagline**: Montserrat **Regular**, huruf besar, tracking otomatis melebar persis selebar wordmark — `fonts/Montserrat-Regular.ttf`
- Semua teks di-outline (`opentype.js`) → path SVG. **Logo tidak bergantung font terpasang.**

## 3. Varian

| Varian                 | File (SVG di `logo/`, PNG di `png/`)                                     | Pakai untuk                            |
| ---------------------- | ------------------------------------------------------------------------ | -------------------------------------- |
| Primary                | `undangane-primary`                                                      | Logo utama horizontal + tagline        |
| Brand                  | `undangane-brand`                                                        | Horizontal tanpa tagline               |
| Compact                | `undangane-compact`                                                      | Header sempit (gap ikon–teks 0.11)     |
| Stacked                | `undangane-stacked`                                                      | Vertikal + tagline (footer, kartu)     |
| Print                  | `undangane-print`                                                        | Vertikal tanpa tagline (cetak 1 warna) |
| Icon                   | `undangane-icon`                                                         | Ikon murni (1054×1038), avatar kecil   |
| Social                 | `undangane-social`                                                       | Avatar persegi 1024×1024               |
| Monochrome black/white | `undangane-monochrome-black/white`                                       | Latar warna solid / pasangan kontras   |
| Watermark              | `undangane-watermark`                                                    | Overlay undangan (hitam 15%)           |
| Favicon                | `undangane-favicon` + `png/favicon.ico`                                  | Browser tab (ikon saja, padding 0.84)  |
| App icon               | `undangane-appicon` + `png/undangane-app-icon-{512,192,180,152,120}.png` | PWA / store (ikon saja, padding 0.76)  |

Komponen React `<UndanganELogo>` (Fase 0) memakai data dari `generated/logo-paths.ts`.

## 4. Konstruksi (jangan diubah manual)

Rasio diturunkan dari pengukuran referensi, hidup di `scripts/build.mjs`:

- Horizontal: `em = 0.524 × iconH`, gap `0.16 × iconH`, baseline wordmark `0.647 × iconH`, baseline tagline `0.904 × iconH`, tagline `0.25 × em`
- Stacked: `em = 0.362 × iconH`, top kapital `1.06 × iconH`, tagline baseline `+0.427 × em`
- Social 1024²: ikon `0.46 × sisi`, wordmark `0.74 × sisi`

## 5. Ukuran minimum & clear space

- Lockup horizontal: lebar minimal **120px**; ikon saja: **16px**
- Clear space: **≥ 0.5 × tinggi ikon** di semua sisi — tanpa teks/gambar lain di area ini

## 6. Penggunaan yang dilarang

- Mengubah warna di luar varian (merah muda lain, gradient, warna pelangi)
- Menambah shadow, glow, outline, efek 3D, atau memiringkan/meregangkan
- Menyusun ulang ikon–wordmark, mengganti font, atau menghapus letter "E" berwarna rose
- Menaruh logo monokrom warna-warni; varian white hanya di latar gelap, black hanya di latar terang

## 7. Regenerasi aset

```powershell
npm install          # sekali di brand/ (sudah terpasang)
npm run build        # 12 SVG + generated/logo-paths.ts
npm run export       # PNG + favicon.ico + verification sheets
```

Jangan edit `logo/*.svg` atau `generated/*` manual — edit `scripts/build.mjs` / `src/icon.svg`, lalu regenerasi.

## 8. Migrasi ke aplikasi (Fase 0)

1. Salin `logo/*.svg` → `public/brand/logo/`, PNG → `public/brand/png/`
2. Salin `tokens.css` → dipakai Tailwind `@theme` (`DECISIONS.md` §2: palet warm neutral)
3. Buat `<UndanganELogo variant size className>` dari `generated/logo-paths.ts` (inline SVG, `currentColor` untuk varian mono/watermark)
