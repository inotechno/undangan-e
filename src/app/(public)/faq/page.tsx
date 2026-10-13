import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Pertanyaan Umum",
  description:
    "Jawaban pertanyaan umum tentang UndanganE: cara membuat undangan, RSVP, QR check-in, pembayaran QRIS, privasi, dan syarat ketentuan.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ | UndanganE",
    description: "Pertanyaan umum seputar undangan digital UndanganE.",
    url: "/faq",
  },
};

const FAQS: Array<{ id: string; q: string; a: string }> = [
  {
    id: "gratis",
    q: "Apakah membuat undangan gratis?",
    a: "Ya. Mendaftar dan membuat undangan (edit teks, foto, musik, daftar tamu) gratis. Kamu hanya membayar biaya publikasi sekali via QRIS saat siap membagikan undangan ke tamu.",
  },
  {
    id: "bayar",
    q: "Bagaimana cara membayar?",
    a: "Pembayaran menggunakan QRIS. Setelah kamu memilih publikasi, sistem menampilkan QRIS untuk dipindai dari aplikasi bank atau e-wallet apa pun. Status pembayaran terkonfirmasi otomatis, undangan langsung aktif.",
  },
  {
    id: "rsvp",
    q: "Apa itu RSVP dan bagaimana cara kerjanya?",
    a: "RSVP (RSVP — Répondez s'il vous plaît) memungkinkan tamu mengonfirmasi kehadiran mereka (hadir/tidak hadir) langsung dari link undangan. Data RSVP tampil di dashboard pengguna.",
  },
  {
    id: "qr",
    q: "Apa itu QR check-in?",
    a: "Setiap tamu yang terdaftar memiliki QR unik. Di hari-H, panitia memindai QR tersebut menggunakan HP (tanpa aplikasi tambahan) untuk mencatat kehadiran. Anti-duplikat dan real-time.",
  },
  {
    id: "edit",
    q: "Bisakah undangan diedit setelah terbit?",
    a: "Ya. Kamu tetap bisa mengubah teks, foto, musik, dan detail acara kapan saja melalui dashboard setelah undangan terbit. Perubahan langsung tercermin pada link yang sama.",
  },
  {
    id: "tamu",
    q: "Berapa banyak tamu yang bisa ditampung?",
    a: "Tidak ada batas ketat jumlah tamu. Sistem dirancang untuk menangani ribuan tamu per undangan. Tamu bisa ditambahkan manual atau diimpor massal.",
  },
  {
    id: "reseller",
    q: "Apa itu reseller dan bagaimana cara upgrade?",
    a: "Reseller adalah pengguna yang upgrade dengan biaya sekali bayar (Rp50.000). Setelah aktif, kamu mendapat harga publikasi lebih murah dan bisa mencatat nama pelanggan beserta harga jual — cocok untuk event organizer.",
  },
  {
    id: "privasi",
    q: "Bagaimana data tamu dilindungi?",
    a: "Data tamu hanya digunakan untuk kebutuhan undangan (nama, konfirmasi kehadiran, pesan). Kami tidak menjual data ke pihak ketiga. Kamu dapat menghapus undangan beserta datanya kapan saja dari dashboard.",
  },
  {
    id: "syarat",
    q: "Apa syarat & ketentuan penggunaan?",
    a: "UndanganE hanya untuk acara yang sah dan tidak melanggar hukum. Konten tidak boleh mengandung SARA, pornografi, atau penipuan. Pelanggaran dapat mengakibatkan penonaktifan undangan tanpa pengembalian biaya publikasi.",
  },
  {
    id: "share",
    q: "Bagaimana cara membagikan undangan ke tamu?",
    a: "Setelah undangan aktif, kamu mendapat link permanen (mis. undangane.com/i/slug-kamu). Bagikan lewat WhatsApp, SMS, email, atau gunakan QR check-in di hari-H.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <h1 className="heading-display">Pertanyaan Umum</h1>
          <p className="mt-3 text-muted-warm">
            Tidak menemukan jawaban yang kamu cari?{" "}
            <Link href="/panduan" className="font-medium text-teal hover:underline">
              Baca panduan lengkap
            </Link>
            .
          </p>
        </div>

        <dl className="mt-10 space-y-4">
          {FAQS.map((f) => (
            <div
              key={f.id}
              id={f.id}
              className="rounded-xl border border-border-warm bg-surface p-6"
            >
              <dt className="text-base font-semibold text-charcoal">{f.q}</dt>
              <dd className="mt-2 text-sm leading-7 text-muted-warm">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
