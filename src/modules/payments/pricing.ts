import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { accountTypeEnum } from "@/db/schema";

type AccountType = (typeof accountTypeEnum.enumValues)[number];

const FALLBACK_PRICE: Record<AccountType, number> = { user: 15000, reseller: 10000 };

export async function getActivePrice(accountType: AccountType): Promise<number> {
  const rows = await db
    .select({ amountIdr: schema.pricingRules.amountIdr })
    .from(schema.pricingRules)
    .where(and(eq(schema.pricingRules.accountType, accountType), eq(schema.pricingRules.active, true)))
    .limit(1);
  return rows[0]?.amountIdr ?? FALLBACK_PRICE[accountType];
}

export async function listActivePrices(): Promise<Record<AccountType, number>> {
  const rules = await db
    .select()
    .from(schema.pricingRules)
    .where(eq(schema.pricingRules.active, true));
  return {
    user: rules.find((r) => r.accountType === "user")?.amountIdr ?? FALLBACK_PRICE.user,
    reseller: rules.find((r) => r.accountType === "reseller")?.amountIdr ?? FALLBACK_PRICE.reseller,
  };
}

/** Ganti harga aktif: nonaktifkan baris aktif lama, buat baris baru (riwayat dipertahankan). */
export async function setActivePrice(
  accountType: AccountType,
  amountIdr: number,
  actorId: string,
): Promise<{ amountIdr: number }> {
  if (!Number.isInteger(amountIdr) || amountIdr <= 0) throw new Error("Harga tidak valid");
  await db.transaction(async (tx) => {
    await tx
      .update(schema.pricingRules)
      .set({ active: false })
      .where(and(eq(schema.pricingRules.accountType, accountType), eq(schema.pricingRules.active, true)));
    await tx.insert(schema.pricingRules).values({
      id: crypto.randomUUID(),
      accountType,
      amountIdr,
      active: true,
      createdBy: actorId,
    });
  });
  return { amountIdr };
}

export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const rows = await db
    .select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1);
  const v = rows[0]?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export async function getSettingBoolean(key: string, fallback: boolean): Promise<boolean> {
  const rows = await db
    .select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1);
  const v = rows[0]?.value;
  return typeof v === "boolean" ? v : fallback;
}

// ─── Biaya transaksi (fee & pajak — dikonfigurasi admin) ─────────────────────

export type PaymentCostSettings = {
  /** Persentase biaya layanan/MDR (% dari harga setelah diskon). */
  feePercent: number;
  /** true = biaya layanan dibebankan ke pembeli (ikut total bayar). */
  feeBorneByBuyer: boolean;
  /** Persentase pajak/PPN (% dari harga setelah diskon). */
  taxPercent: number;
  /** true = pajak dibebankan ke pembeli (ikut total bayar). */
  taxBorneByBuyer: boolean;
};

export const PAYMENT_COST_DEFAULTS: PaymentCostSettings = {
  feePercent: 0.7,
  feeBorneByBuyer: false,
  taxPercent: 11,
  taxBorneByBuyer: false,
};

const PAYMENT_COST_KEYS = [
  "payment.fee_percent",
  "payment.fee_borne_by_buyer",
  "payment.tax_percent",
  "payment.tax_borne_by_buyer",
] as const;

export async function getPaymentCostSettings(): Promise<PaymentCostSettings> {
  const rows = await db
    .select({ key: schema.settings.key, value: schema.settings.value })
    .from(schema.settings)
    .where(inArray(schema.settings.key, [...PAYMENT_COST_KEYS]));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: string, fallback: number): number => {
    const v = map.get(key);
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  const bool = (key: string, fallback: boolean): boolean => {
    const v = map.get(key);
    return typeof v === "boolean" ? v : fallback;
  };
  return {
    feePercent: num("payment.fee_percent", PAYMENT_COST_DEFAULTS.feePercent),
    feeBorneByBuyer: bool("payment.fee_borne_by_buyer", PAYMENT_COST_DEFAULTS.feeBorneByBuyer),
    taxPercent: num("payment.tax_percent", PAYMENT_COST_DEFAULTS.taxPercent),
    taxBorneByBuyer: bool("payment.tax_borne_by_buyer", PAYMENT_COST_DEFAULTS.taxBorneByBuyer),
  };
}

export async function setPaymentCostSettings(
  input: PaymentCostSettings,
  updatedBy: string,
): Promise<PaymentCostSettings> {
  const entries: Array<[string, unknown]> = [
    ["payment.fee_percent", input.feePercent],
    ["payment.fee_borne_by_buyer", input.feeBorneByBuyer],
    ["payment.tax_percent", input.taxPercent],
    ["payment.tax_borne_by_buyer", input.taxBorneByBuyer],
  ];
  for (const [key, value] of entries) {
    const now = new Date();
    await db
      .insert(schema.settings)
      .values({ key, value, updatedBy, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value, updatedBy, updatedAt: now },
      });
  }
  return input;
}
