import type { Metadata } from "next";
import { listActivePrices } from "@/modules/payments/pricing";
import { formatIdr } from "@/modules/admin/labels";
import { PricingForm } from "./pricing-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Harga Publikasi — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPricingPage() {
  const prices = await listActivePrices();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Harga Publikasi</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Harga aktif dipakai untuk pesanan baru. Perubahan tidak memengaruhi pesanan lama.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Harga Reguler", value: formatIdr(prices.user), note: "Per undangan" },
          { label: "Harga Reseller", value: formatIdr(prices.reseller), note: "Per undangan" },
          {
            label: "Selisih Reseller",
            value: formatIdr(Math.max(0, prices.user - prices.reseller)),
            note: "Keuntungan reseller",
          },
          {
            label: "Upgrade Reseller",
            value: "Sekali bayar",
            note: "Konfigurasi terpisah",
          },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
          >
            <div className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">{s.label}</div>
            <div className="mt-1.5 text-[22px] font-extrabold tracking-[-0.6px]">{s.value}</div>
            <div className="mt-1 text-[10px] text-[#687b88]">{s.note}</div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PricingForm accountType="user" currentAmount={prices.user} label="Pengguna reguler" />
        <PricingForm accountType="reseller" currentAmount={prices.reseller} label="Reseller" />
      </div>

      <section className="mt-4 rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-2 text-[15px] font-bold">Aturan harga</h2>
        <p className="text-[11px] leading-relaxed text-[#687b88]">
          Setiap perubahan membuat baris <b>pricing_rules</b> baru dengan status aktif; aturan lama
          dinonaktifkan (unique index satu aturan aktif per tipe). Order yang sudah dibuat menyimpan
          snapshot harga sehingga perubahan di sini tidak mengubah tagihan yang sudah ada.
        </p>
      </section>
    </div>
  );
}
