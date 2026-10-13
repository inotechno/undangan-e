# 04 — Peran & Hak Akses

## 1. Peran
| Peran | Sumber | Keterangan |
|---|---|---|
| `user` | registrasi (satu-satunya pilihan saat daftar) | Pengguna reguler — **semua orang mulai dari sini** |
| `reseller` | **upgrade berbayar sekali bayar** (harga admin-configurable, mis. Rp50.000) via QRIS | Role diberikan sistem otomatis setelah order upgrade `paid`; bisa dicabut admin |
| `contributor` | ditandai admin | **Disembunyikan di MVP**; struktur role tetap disiapkan |
| `admin` | ditandai admin | Operasional penuh |

- **Tidak ada pilihan role di pendaftaran** — mitigasi utama agar publik tidak langsung mendapat harga grosir reseller.
- **Jalur reseller**: `POST /api/reseller/upgrade` → order `kind=reseller_upgrade` → bayar QRIS → webhook `paid` → INSERT `user_roles(user_id, 'reseller')` + audit (`05`, `11`).
- `type` di `users` = tampilan akun (user/reseller/contributor); `roles` = kapabilitas. Seorang bisa `user`+`reseller`.

## 2. Matriks kapabilitas

| Kapabilitas | user | reseller | contributor | admin |
|---|---|---|---|---|
| Lihat katalog publik/undangan publik | ✔ | ✔ | ✔ | ✔ |
| Buat/edit/publish **undangan milik sendiri** | ✔ | ✔ | ✖ | ✔ |
| Catat nama pelanggan + harga jual | ✖ | ✔ | ✖ | ✔ |
| Kelola tamu / RSVP / check-in (milik atau via token kelola) | ✔ | ✔ | ✖ | ✔ |
| Pesanan & pembayaran milik | ✔ | ✔ | ✖ | ✔ |
| Voucher: validasi & pakai saat checkout | ✔ | ✔ | ✔ | ✔ |
| Voucher: buat/hapus (CRUD admin) | ✖ | ✖ | ✖ | ✔ |
| Harga publikasi: baca | ✔ | ✔ | ✔ | ✔ |
| Harga publikasi: ubah (`pricing_rules`) | ✖ | ✖ | ✖ | ✔ |
| Dashboard kontributor / submit template | ✖ | ✖ | ✔ (nanti) | — |
| Review/persetujuan template, terbitkan katalog | ✖ | ✖ | ✖ | ✔ |
| Pengguna, peran, kategori, pengaturan | ✖ | ✖ | ✖ | ✔ |
| Kompensasi & payout | ✖ | ✖ | ✔ (baca miliknya) | ✔ |
| Log audit | ✖ | ✖ | ✖ | ✔ |

## 3. Strategi enforcement (server-side, semua lapisan)
1. **Guard route**: wrapper `requireAuth()`, `requireRole('admin')` di server action & route handler.
2. **Scope di query** (anti-IDOR): setiap repository menerima `actor` dan menambahkan `WHERE owner_id = $actor` — bukan "find by id lalu cek".
3. **Resource policy**: `canEditInvitation(actor, invitation)` — owner, admin, atau pemegang token kelola (scope terbatas).
4. **Token kelola** (`/kelola/[token]`): grant akses **satu undangan saja** untuk daftar tamu + check-in; tidak boleh membaca config lain, order, atau data pemilik.
5. **Tabel pengujian otorisasi**: matrix role × endpoint × (own|other|anon) → allow/deny, dijalankan di CI (`14-PENGUJIAN.md`).

## 4. Isolasi data reseller
- Reseller hanya melihat `invitations.reseller_id = self OR owner_id = self`.
- Link kelola pelanggan tidak membocorkan id pemilik/reseller di URL (hanya token acak).
- Pelanggan (pemegang token) tidak bisa berpindah undangan (validasi scope per request).

## 5. Aturan khusus
- **Upgrade reseller**: sekali bayar (bukan langganan); harga dari `settings.reseller.upgrade_price_idr` (admin ubah kapan saja, snapshot ke order saat dibuat); pemberian role idempoten (webhook ganda tidak dobel); voucher tidak berlaku untuk order upgrade; user yang sudah reseller tidak bisa beli ulang.
- **Pencabutan reseller** oleh admin (mis. penyalahgunaan): hapus role → order berjalan tidak dihukum, harga baru hanya untuk order berikutnya; refund upgrade dengan opsi "cabut status reseller"; semua aksi audit.
- **Pengawasan abuse**: panel admin menampilkan daftar akun reseller + jumlah order + tanggal upgrade; audit log `reseller.upgraded` / `reseller.revoked`.
- Admin **tidak** bisa menaikkan role dirinya sendiri ke admin (wajib dari akun admin lain; dicatat audit).
- Suspensi akun (`status=suspended`): sesi dicabut, login ditolak, undangan tetap terbit (tidak menghukum tamu).
- Aksi destruktif admin (hapus voucher berjalan, refund upgrade reseller, cabut role) memerlukan konfirmasi ganda + alasan + audit log.
