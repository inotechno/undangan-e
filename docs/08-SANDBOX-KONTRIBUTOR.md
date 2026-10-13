# 08 — Sandbox Kontributor (DESAIN — dieksekusi setelah revenue)

Status: **ditunda**. MVP memakai template internal (`06`). Dokumen ini menyimpan arsitektur agar siap tanpa redesain.

## 1. Ancaman yang harus ditutup
Kode kontributor = tidak terpercaya: RCE di server aplikasi, pencurian sesi/PII, supply-chain, beban resource, eksfiltrasi data.

## 2. Opsi & pilihan

| Opsi | Keamanan | Biaya/ops | Keputusan |
|---|---|---|---|
| Build di proses app | ❌ RCE | murah | Tolak |
| **Container Docker ephemeral** (network none, read-only, non-root, limit CPU/mem/PID/time, tanpa env secrets, output discan + di-hash lalu dihancurkan) | ✅ kuat | 1 VPS + compose | **Dipilih** |
| MicroVM (Firecracker/gVisor) | ✅✅ | berat | Hardening lanjutan |
| Layanan build eksternal | ✅ | bayar per build, lock-in | Fallback |

## 3. Pipeline
1. Upload zip → validasi ukuran, path traversal, MIME, struktur.
2. `package.json`/lockfile → allowlist dependency; larang `postinstall`; hitung jumlah & ukuran.
3. Static check: dilarang `eval`, `Function`, `process`, `node:*`, fetch bebas; manifest capability lint; budget bundle (mis. ≤1.5MB gz).
4. Build di container (offline cache dependency / registry mirror terbatas).
5. Output → R2 immutable + `sha256`; daftar `template_versions`.
6. Preview di origin `tpl.` dalam `<iframe sandbox="allow-scripts allow-forms">` + CSP (`default-src 'none'; script-src 'self'; connect-src 'none'`).
7. Data & mutasi: parent terpercaya inject data via postMessage (nonce + origin + Zod); RSVP/dsb. lewat relay capability-token 5 menit.

## 4. Persetujuan & lifecycle
- Admin review di UI sandbox (screenshot otomatis 3 breakpoint + jalankan preview).
- Approve → lock `(bundle_hash, sdk_version)` → katalog.
- Revoke/takedown → hash denylist di edge → undangan terdampak jatuh ke **fallback renderer first-party** dengan data sama.
- Incident response: deny → notifikasi pemilik undangan → rollback version.

## 5. Anti-pattern yang dihindari
- Menjalankan `npm install` app utama dengan dependency kontributor.
- Membagikan origin cookies dengan preview.
- Menganggap iframe sandbox cukup tanpa membatasi build-time & network.

## 6. Prasyarat operasional
Kuota build per kontributor/hari, antrean di VPS (Postgres `SKIP LOCKED`), alert kedalaman antrean, biaya CPU bulanan dipantau. Buka hanya setelah revenue menutupi beban + tim siap review keamanan berkala.
