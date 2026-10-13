import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { VoucherAdmin } from "./voucher-admin";

export const instant = false;

export const metadata: Metadata = {
  title: "Voucher — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminVouchersPage() {
  const rows = await db
    .select()
    .from(schema.vouchers)
    .orderBy(desc(schema.vouchers.createdAt))
    .limit(200);
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Voucher Diskon</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Buat dan kelola kode diskon untuk checkout publikasi & upgrade.
        </p>
      </div>
      <VoucherAdmin initial={rows} />
    </div>
  );
}
