import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { Check } from "lucide-react";
import { eq } from "drizzle-orm";
import { formatIdr } from "@/core/money";
import { db, schema } from "@/db";

export const metadata: Metadata = {
  title: "Harga — Undangan Digital Terjangkau",
  description:
    "Harga publikasi undangan digital di UndanganE. Bayar sekali via QRIS, tanpa langganan. Harga khusus reseller tersedia.",
  alternates: { canonical: "/harga" },
  openGraph: {
    title: "Harga Undangan Digital | UndanganE",
    description:
      "Bayar sekali via QRIS, tanpa langganan. Harga terjangkau untuk semua kalangan.",
    url: "/harga",
  },
};

const FEATURES_USER = [
  "Semua template premium",
  "Edit teks, foto, musik",
  "Kelola tamu & RSVP",
  "QR check-in tamu",
  "Buku tamu digital",
  "Link undangan permanen",
];

const FEATURES_RESELLER = [
  "Semua fitur pengguna reguler",
  "Harga publikasi lebih murah",
  "Catat nama pelanggan & harga jual",
  "Link kelola privat per pelanggan",
  "Cocok untuk event organizer",
];

async function getPricing() {
  "use cache";
  cacheLife("hours");
  try {
    const rules = await db
      .select()
      .from(schema.pricingRules)
      .where(eq(schema.pricingRules.active, true));
    const userRule = rules.find((r) => r.accountType === "user");
    const resellerRule = rules.find((r) => r.accountType === "reseller");
    return {
      user: userRule?.amountIdr ?? 15000,
      reseller: resellerRule?.amountIdr ?? 10000,
    };
  } catch {
    return { user: 15000, reseller: 10000 };
  }
}

export default async function PricingPage() {
  const pricing = await getPricing();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="heading-display">Harga Sederhana & Transparan</h1>
        <p className="mt-3 text-muted-warm">
          Bayar sekali saat publikasi — tanpa langganan, tanpa biaya tersembunyi.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
        {/* User reguler */}
        <div className="flex flex-col rounded-xl border border-border-warm bg-surface p-8">
          <h2 className="text-lg font-semibold text-charcoal">Pengguna Reguler</h2>
          <p className="mt-1 text-sm text-muted-warm">
            Cocok untuk membuat undangan sendiri.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-heading font-semibold text-charcoal">
              {formatIdr(pricing.user)}
            </span>
            <span className="text-sm text-muted-warm">/ undangan</span>
          </div>
          <ul className="mt-6 flex-1 space-y-3">
            {FEATURES_USER.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-charcoal">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/daftar"
            className="mt-8 inline-flex h-10 items-center justify-center rounded-lg border border-border-warm bg-surface px-5 text-sm font-medium text-charcoal transition-colors hover:bg-muted"
          >
            Buat Undangan
          </Link>
        </div>

        {/* Reseller */}
        <div className="relative flex flex-col rounded-xl border-2 border-teal bg-surface p-8">
          <span className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-0.5 text-xs font-semibold text-white">
            Untuk Reseller
          </span>
          <h2 className="text-lg font-semibold text-charcoal">Reseller</h2>
          <p className="mt-1 text-sm text-muted-warm">
            Cocok untuk event organizer & EO.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-heading font-semibold text-teal">
              {formatIdr(pricing.reseller)}
            </span>
            <span className="text-sm text-muted-warm">/ undangan</span>
          </div>
          <p className="mt-2 text-xs text-muted-warm">
            Harga khusus reseller — lebih murah dari harga reguler.
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {FEATURES_RESELLER.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-charcoal">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/daftar"
            className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-teal px-5 text-sm font-medium text-white transition-colors hover:bg-teal-hover"
          >
            Daftar & Upgrade Reseller
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border-warm bg-muted p-6 text-center">
        <h2 className="text-base font-semibold text-charcoal">
          Bagaimana cara upgrade reseller?
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-warm">
          Daftar sebagai pengguna reguler, lalu upgrade ke reseller melalui
          dashboard dengan biaya sekali bayar via QRIS. Setelah pembayaran
          terkonfirmasi, harga reseller langsung aktif untuk undangan
          berikutnya.
        </p>
      </div>
    </div>
  );
}
