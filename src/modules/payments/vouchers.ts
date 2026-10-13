import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { accountTypeEnum } from "@/db/schema";

type AccountType = (typeof accountTypeEnum.enumValues)[number];

export function normalizeVoucherCode(input: string): string {
  return input.trim().toUpperCase();
}

export type VoucherRow = typeof schema.vouchers.$inferSelect;

export function computeDiscount(
  v: Pick<VoucherRow, "type" | "value" | "maxDiscountIdr">,
  unitPriceIdr: number,
): number {
  if (v.type === "percent") {
    const raw = Math.floor((unitPriceIdr * v.value) / 100);
    return Math.min(raw, v.maxDiscountIdr ?? Number.MAX_SAFE_INTEGER, unitPriceIdr);
  }
  return Math.min(v.value, unitPriceIdr);
}

export type VoucherCheck =
  | { ok: true; voucher: VoucherRow; discount: number; final: number }
  | { ok: false; error: string };

export async function checkVoucher(input: {
  code: string;
  accountType: AccountType;
  unitPriceIdr: number;
  userId: string;
  minFinalAmountIdr: number;
}): Promise<VoucherCheck> {
  const code = normalizeVoucherCode(input.code);
  const [v] = await db
    .select()
    .from(schema.vouchers)
    .where(eq(schema.vouchers.code, code))
    .limit(1);
  if (!v) return { ok: false, error: "Kode voucher tidak ditemukan" };
  if (!v.active) return { ok: false, error: "Voucher sudah tidak aktif" };

  const now = new Date();
  if (now < v.validFrom) return { ok: false, error: "Voucher belum berlaku" };
  if (v.validUntil && now > v.validUntil) return { ok: false, error: "Voucher sudah kedaluwarsa" };
  if (v.appliesTo !== "all" && v.appliesTo !== input.accountType) {
    return {
      ok: false,
      error: input.accountType === "reseller" ? "Voucher hanya untuk pengguna reguler" : "Voucher hanya untuk reseller",
    };
  }
  if (input.unitPriceIdr < v.minOrderIdr) {
    return { ok: false, error: `Minimal order Rp${v.minOrderIdr.toLocaleString("id-ID")}` };
  }
  if (v.maxTotalUses !== null && v.usedCount >= v.maxTotalUses) {
    return { ok: false, error: "Kuota voucher sudah habis" };
  }
  if (v.maxUsesPerUser !== null) {
    const used = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(and(eq(schema.orders.voucherId, v.id), eq(schema.orders.ownerId, input.userId)))
      .limit(v.maxUsesPerUser);
    if (used.length >= v.maxUsesPerUser) {
      return { ok: false, error: "Anda sudah pernah memakai voucher ini" };
    }
  }

  const discount = computeDiscount(v, input.unitPriceIdr);
  const final = input.unitPriceIdr - discount;
  if (final < input.minFinalAmountIdr) {
    return {
      ok: false,
      error: `Voucher terlalu besar — tagihan setelah diskon Rp${final.toLocaleString("id-ID")}, di bawah minimum transaksi QRIS Duitku (Rp${input.minFinalAmountIdr.toLocaleString("id-ID")}). Pakai voucher lain dengan potongan lebih kecil.`,
    };
  }
  return { ok: true, voucher: v, discount, final };
}

/** Redeem atomik (anti double-spend): 0 baris = tidak valid / kuota habis. */
export async function redeemVoucher(voucherId: string, userId: string): Promise<boolean> {
  const result = await db.execute(sql`
    UPDATE vouchers
    SET used_count = used_count + 1, updated_at = now()
    WHERE id = ${voucherId} AND active
      AND (max_total_uses IS NULL OR used_count < max_total_uses)
      AND now() >= valid_from
      AND (valid_until IS NULL OR now() <= valid_until)
      AND (
        max_uses_per_user IS NULL
        OR (
          SELECT count(*)::int FROM orders o
          WHERE o.voucher_id = vouchers.id AND o.owner_id = ${userId}
        ) < max_uses_per_user
      )
    RETURNING id
  `);
  const rows = result as unknown as Array<{ id: string }>;
  return rows.length > 0;
}

/** Kompensasi: kembalikan kuota saat order gagal/expired setelah redeem. */
export async function releaseVoucher(voucherId: string): Promise<void> {
  await db.execute(sql`
    UPDATE vouchers
    SET used_count = GREATEST(used_count - 1, 0), updated_at = now()
    WHERE id = ${voucherId}
  `);
}
