import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/auth/guard";
import { getPaymentCostSettings } from "@/modules/payments/pricing";
import { PaymentFeesForm } from "./payment-fees-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Pengaturan Platform — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const cost = await getPaymentCostSettings();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Pengaturan Platform</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">Konfigurasi umum, akses, dan kontrol operasional.</p>
      </div>

      <section className="mb-4 rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-2 text-[15px] font-bold">Kebijakan keamanan (aktif)</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[11px] leading-relaxed text-[#687b88]">
          <li>Semua route privat memerlukan autentikasi (guard server-side).</li>
          <li>Repository menerapkan scope owner pada query untuk mencegah IDOR.</li>
          <li>Aksi sensitif admin tercatat di audit log (actor, action, resource).</li>
          <li>Admin tidak dapat menaikkan role dirinya sendiri.</li>
        </ul>
      </section>

      <div className="mb-4">
        <PaymentFeesForm
          initial={{
            feePercent: cost.feePercent,
            feeBorneByBuyer: cost.feeBorneByBuyer,
            taxPercent: cost.taxPercent,
            taxBorneByBuyer: cost.taxBorneByBuyer,
          }}
        />
      </div>

      <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-2 text-[15px] font-bold">Pengaturan yang tersedia</h2>
        <p className="mb-4 text-[11px] leading-relaxed text-[#687b88]">
          Sebagian konfigurasi sudah dapat diubah lewat halaman terpisah:
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/pricing"
            className="inline-flex h-9 items-center rounded-lg border border-[#dbe5e9] bg-white px-3 text-[11px] font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal"
          >
            Harga & Upgrade
          </Link>
          <Link
            href="/admin/vouchers"
            className="inline-flex h-9 items-center rounded-lg border border-[#dbe5e9] bg-white px-3 text-[11px] font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal"
          >
            Voucher
          </Link>
        </div>
        <p className="mt-4 text-[10px] text-[#687b88]">
          Form pengaturan platform (nama, URL publik, email dukungan) akan tersedia pada iterasi
          berikutnya.
        </p>
      </section>
    </div>
  );
}
