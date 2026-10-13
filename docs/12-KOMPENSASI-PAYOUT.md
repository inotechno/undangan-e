# 12 — Kompensasi & Payout Kontributor (fase nanti)

Status: **struktur disiapkan, aktivasi setelah program kontributor dibuka.** MVP tidak menjalankan payout.

## 1. Prinsip
- Empat peristiwa terpisah: **approve template ≠ terbit katalog ≠ layak kompensasi ≠ payout**.
- Jumlah & syarat = keputusan bisnis pemilik (tidak ada angka hardcode). Sistem hanya mesin ledger.
- Anti-duplikat dilevel DB.

## 2. Model
- `compensation_rules`: `template_id`/`submission_id`, tipe `flat_per_version` | `per_publish`, `amount_idr`, `conditions` JSONB (mis. minimal hari setelah publish), `active`.
- `earning_ledger`: `contributor_id`, `template_version_id`, `rule_id`, `amount_idr`, `state` enum(`eligible`,`committed`,`paid`,`void`) — **UNIQUE(template_version_id, rule_id)**.
- `payouts`: `contributor_id`, `total_idr`, `status` enum(`pending`,`approved`,`processing`,`paid`,`failed`), `provider_ref`, `processed_by`, `notes`.
- `payout_items`: `earning_id` **UNIQUE** — satu earning masuk tepat satu payout.

## 3. Alur
```
submission approved
  → cocok compensation_rules → INSERT earning_ledger (eligible)
  → syarat terpenuhi (cron/manual) → committed (saldo terhitung)
  → admin buat payout → items select earning committed → payout pending
  → approved → processing (transfer manual bank) → paid (lampirkan bukti) | failed
```
- Pembatalan/koreksi: baris ledger `void` + adjustment baru (append-only; paid tidak diubah in-place).
- Data rekening kontributor: dienkripsi AES-256-GCM (`PAYOUT_ENCRYPTION_KEY`), tampil masked, reveal = audit.
- MVP transfer manual (rekening bank Indonesia) — otomasi disbursement hanya untuk badan usaha (catatan Duitku).

## 4. UI
- Kontributor: saldo, riwayat earning, riwayat payout, status.
- Admin: antrean payout, aksi massal, ekspor CSV, audit.
