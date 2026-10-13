import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Panduan — Cara Menggunakan UndanganE",
  description:
    "Panduan lengkap membuat undangan digital di UndanganE: daftar, pilih template, edit undangan, kelola tamu, publikasi QRIS, hingga QR check-in hari-H.",
  alternates: { canonical: "/panduan" },
  openGraph: {
    title: "Panduan UndanganE",
    description:
      "Langkah demi langkah membuat undangan digital dari nol hingga terbit.",
    url: "/panduan",
  },
};

const SECTIONS: Array<{ id: string; title: string; body: string[] }> = [
  {
    id: "daftar",
    title: "1. Daftar akun",
    body: [
      'Klik "Daftar Gratis" di halaman utama. Isi nama, email, dan kata sandi, lalu verifikasi email bila diminta.',
      "Setelah berhasil, kamu langsung masuk ke dashboard dan bisa mulai membuat undangan.",
    ],
  },
  {
    id: "template",
    title: "2. Pilih template",
    body: [
      'Buka halaman "Template" dan pilih gaya yang sesuai acara — pernikahan, tunangan, ulang tahun, aqiqah, khitanan, keluarga, seminar, atau syukuran.',
      "Klik salah satu template untuk mulai mengedit. Semua template bisa disesuaikan teks, foto, dan musik.",
    ],
  },
  {
    id: "edit",
    title: "3. Edit undangan",
    body: [
      "Isi detail acara: tanggal, waktu, lokasi (alamat + link peta), dan teks sambutan.",
      "Unggah foto pre-wedding / foto acara, pilih musik latar, dan atur urutan section (cover, detail acara, galeri, RSVP, peta, ucapan).",
      "Gunakan mode pratinjau untuk melihat tampilan tamu di HP sebelum menerbitkan.",
    ],
  },
  {
    id: "tamu",
    title: "4. Tambah daftar tamu",
    body: [
      "Tambahkan tamu satu per satu atau impor massal dari file.",
      "Sistem membuat link personal unik per tamu sehingga nama tamu otomatis tampil di undangan mereka.",
    ],
  },
  {
    id: "publikasi",
    title: "5. Publikasi & bayar QRIS",
    body: [
      'Setelah undangan siap, klik "Publikasi". Sistem menampilkan total biaya publikasi sesuai tipe akunmu.',
      "Pindai QRIS dengan aplikasi bank / e-wallet apa pun. Pembayaran terkonfirmasi otomatis, undangan langsung aktif.",
    ],
  },
  {
    id: "bagikan",
    title: "6. Bagikan ke tamu",
    body: [
      "Salin link permanen undanganmu (mis. undangane.com/i/slug-kamu) dan bagikan lewat WhatsApp, SMS, atau email.",
      "Atau kirim link personal masing-masing tamu agar nama mereka otomatis tampil.",
    ],
  },
  {
    id: "checkin",
    title: "7. QR check-in di hari-H",
    body: [
      "Di hari acara, buka dashboard lalu pindai QR unik milik setiap tamu menggunakan HP — tanpa aplikasi tambahan.",
      "Status kehadiran tercatat real-time dan bisa diekspor setelah acara selesai.",
    ],
  },
];

export default function PanduanPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-teal">
          <BookOpen className="size-5" aria-hidden />
        </div>
        <h1 className="heading-display">Panduan Penggunaan</h1>
        <p className="mt-3 text-muted-warm">
          Langkah demi langkah dari mendaftar hingga QR check-in di hari-H.
        </p>
      </div>

      <ol className="mt-10 space-y-6">
        {SECTIONS.map((s) => (
          <li
            key={s.id}
            id={s.id}
            className="rounded-xl border border-border-warm bg-surface p-6"
          >
            <h2 className="text-base font-semibold text-charcoal">{s.title}</h2>
            <div className="mt-2 space-y-2">
              {s.body.map((p) => (
                <p key={p.slice(0, 40)} className="text-sm leading-7 text-muted-warm">
                  {p}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <section id="kontak" className="mt-10 rounded-xl border border-border-warm bg-accent p-6 text-center">
        <h2 className="text-base font-semibold text-charcoal">Masih butuh bantuan?</h2>
        <p className="mt-2 text-sm text-muted-warm">
          Hubungi tim kami lewat email{" "}
          <a
            href="mailto:halo@undangane.id"
            className="font-medium text-teal hover:underline"
          >
            halo@undangane.id
          </a>{" "}
          atau cek{" "}
          <Link href="/faq" className="font-medium text-teal hover:underline">
            FAQ
          </Link>
          .
        </p>
        <Link
          href="/daftar"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-teal px-5 text-sm font-medium text-white transition-colors hover:bg-teal-hover"
        >
          Mulai Buat Undangan
        </Link>
      </section>
    </div>
  );
}
