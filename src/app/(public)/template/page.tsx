import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplateGallery } from "./template-gallery";

export const metadata: Metadata = {
  title: "Galeri Template Undangan Digital",
  description:
    "Jelajahi template undangan digital untuk pernikahan, tunangan, ulang tahun, aqiqah, khitanan, dan seminar. Pilih gaya favoritmu dan sesuaikan dalam hitungan menit.",
  alternates: { canonical: "/template" },
  openGraph: {
    title: "Galeri Template Undangan Digital | UndanganE",
    description:
      "Template undangan digital elegan untuk pernikahan, ulang tahun, aqiqah, dan acara lainnya.",
    url: "/template",
  },
};

export default function TemplateGalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="heading-display">Galeri Template</h1>
        <p className="mt-3 text-muted-warm">
          Pilih template yang paling cocok dengan acaramu. Semua bisa disesuaikan
          teks, foto, musik, dan warnanya.
        </p>
      </div>

      <div className="mt-10">
        <Suspense fallback={<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" />}>
          <TemplateGallery />
        </Suspense>
      </div>

      <div className="mt-14 rounded-xl border border-border-warm bg-accent p-8 text-center">
        <h2 className="text-lg font-semibold text-charcoal">
          Sudah menemukan template favoritmu?
        </h2>
        <p className="mt-2 text-sm text-muted-warm">
          Daftar gratis dan mulai buat undangan digitalmu sekarang.
        </p>
        <a
          href="/daftar"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-teal px-5 text-sm font-medium text-white transition-colors hover:bg-teal-hover"
        >
          Buat Undangan
        </a>
      </div>
    </div>
  );
}
