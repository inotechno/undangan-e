import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { env } from "@/core/config";
import { writeAudit } from "@/modules/audit/log";
import { getActivePrice, getSettingNumber, getSettingBoolean, getPaymentCostSettings } from "./pricing";
import { checkVoucher, redeemVoucher, releaseVoucher } from "./vouchers";
import { createInvoice } from "./duitku";

export const createOrderSchema = z.object({
  invitationId: z.uuid().optional(),
  idempotencyKey: z.string().min(8).max(128),
  code: z.string().max(64).optional(),
});

export type CreateOrderResult =
  | { ok: true; orderId: string; alreadyPaid: boolean; hasInvoice: boolean }
  | { ok: false; error: string; field?: "code" | "invitation" };

export type OrderView = {
  id: string;
  kind: string;
  status: string;
  invitationId: string | null;
  invitationSlug: string | null;
  invitationStatus: string | null;
  ownerId: string;
  accountType: string;
  unitPriceIdr: number;
  discountAmountIdr: number;
  finalAmountIdr: number;
  feePercent: number;
  feeAmountIdr: number;
  feeBorneByBuyer: boolean;
  taxPercent: number;
  taxAmountIdr: number;
  taxBorneByBuyer: boolean;
  payableAmountIdr: number;
  voucherId: string | null;
  voucherCode: string | null;
  createdAt: Date;
  paidAt: Date | null;
  qrString: string | null;
  paymentUrl: string | null;
  reference: string | null;
  attemptExpiresAt: Date | null;
  attemptStatus: string | null;
};

const OPEN_ORDER_STATUSES = ["created", "awaiting_payment"] as const;

export type OrderBreakdown = {
  unitPriceIdr: number;
  discountAmountIdr: number;
  voucherCode: string | null;
  finalAmountIdr: number;
  feePercent: number;
  feeAmountIdr: number;
  feeBorneByBuyer: boolean;
  taxPercent: number;
  taxAmountIdr: number;
  taxBorneByBuyer: boolean;
  payableAmountIdr: number;
};

/**
 * Hitung rincian biaya dari tarif admin (settings):
 * fee & pajak dihitung dari harga setelah diskon; hanya yang
 * dibebankan ke pembeli yang menambah total bayar (payable).
 */
export async function computeBreakdown(input: {
  unitPriceIdr: number;
  discountAmountIdr: number;
  voucherCode?: string | null;
}): Promise<OrderBreakdown> {
  const cost = await getPaymentCostSettings();
  const final = Math.max(0, input.unitPriceIdr - input.discountAmountIdr);
  const feeAmountIdr = Math.round((final * cost.feePercent) / 100);
  const taxAmountIdr = Math.round((final * cost.taxPercent) / 100);
  const payableAmountIdr =
    final + (cost.feeBorneByBuyer ? feeAmountIdr : 0) + (cost.taxBorneByBuyer ? taxAmountIdr : 0);
  return {
    unitPriceIdr: input.unitPriceIdr,
    discountAmountIdr: input.discountAmountIdr,
    voucherCode: input.voucherCode ?? null,
    finalAmountIdr: final,
    feePercent: cost.feePercent,
    feeAmountIdr,
    feeBorneByBuyer: cost.feeBorneByBuyer,
    taxPercent: cost.taxPercent,
    taxAmountIdr,
    taxBorneByBuyer: cost.taxBorneByBuyer,
    payableAmountIdr,
  };
}

function breakdownToColumns(b: OrderBreakdown) {
  return {
    unitPriceIdr: b.unitPriceIdr,
    discountAmountIdr: b.discountAmountIdr,
    finalAmountIdr: b.finalAmountIdr,
    feePercent: b.feePercent,
    feeAmountIdr: b.feeAmountIdr,
    feeBorneByBuyer: b.feeBorneByBuyer,
    taxPercent: b.taxPercent,
    taxAmountIdr: b.taxAmountIdr,
    taxBorneByBuyer: b.taxBorneByBuyer,
    payableAmountIdr: b.payableAmountIdr,
  };
}

async function getOpenInvoice(orderId: string) {
  const [attempt] = await db
    .select()
    .from(schema.paymentAttempts)
    .where(eq(schema.paymentAttempts.orderId, orderId))
    .orderBy(desc(schema.paymentAttempts.createdAt))
    .limit(1);
  if (!attempt) return null;
  if (attempt.status !== "pending") return null;
  if (attempt.expiresAt && attempt.expiresAt.getTime() < Date.now()) return null;
  return attempt;
}

export async function getOrderView(orderId: string): Promise<OrderView | null> {
  const rows = await db
    .select({
      id: schema.orders.id,
      kind: schema.orders.kind,
      status: schema.orders.status,
      invitationId: schema.orders.invitationId,
      invitationSlug: schema.invitations.slug,
      invitationStatus: schema.invitations.status,
      ownerId: schema.orders.ownerId,
      accountType: schema.orders.accountType,
      unitPriceIdr: schema.orders.unitPriceIdr,
      discountAmountIdr: schema.orders.discountAmountIdr,
      finalAmountIdr: schema.orders.finalAmountIdr,
      feePercent: schema.orders.feePercent,
      feeAmountIdr: schema.orders.feeAmountIdr,
      feeBorneByBuyer: schema.orders.feeBorneByBuyer,
      taxPercent: schema.orders.taxPercent,
      taxAmountIdr: schema.orders.taxAmountIdr,
      taxBorneByBuyer: schema.orders.taxBorneByBuyer,
      payableAmountIdr: schema.orders.payableAmountIdr,
      voucherId: schema.orders.voucherId,
      voucherCode: schema.orders.voucherCode,
      createdAt: schema.orders.createdAt,
      paidAt: schema.orders.paidAt,
      attemptStatus: schema.paymentAttempts.status,
      qrString: schema.paymentAttempts.qrString,
      reference: schema.paymentAttempts.providerRef,
      attemptExpiresAt: schema.paymentAttempts.expiresAt,
      attemptRaw: schema.paymentAttempts.rawLast,
    })
    .from(schema.orders)
    .leftJoin(schema.invitations, eq(schema.orders.invitationId, schema.invitations.id))
    .leftJoin(schema.paymentAttempts, eq(schema.orders.id, schema.paymentAttempts.orderId))
    .where(eq(schema.orders.id, orderId))
    .orderBy(desc(schema.paymentAttempts.createdAt))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    invitationId: row.invitationId,
    invitationSlug: row.invitationSlug ?? null,
    invitationStatus: row.invitationStatus ?? null,
    ownerId: row.ownerId,
    accountType: row.accountType,
    unitPriceIdr: row.unitPriceIdr,
    discountAmountIdr: row.discountAmountIdr,
    finalAmountIdr: row.finalAmountIdr,
    feePercent: row.feePercent ?? 0,
    feeAmountIdr: row.feeAmountIdr ?? 0,
    feeBorneByBuyer: row.feeBorneByBuyer ?? false,
    taxPercent: row.taxPercent ?? 0,
    taxAmountIdr: row.taxAmountIdr ?? 0,
    taxBorneByBuyer: row.taxBorneByBuyer ?? false,
    payableAmountIdr: row.payableAmountIdr ?? row.finalAmountIdr,
    voucherId: row.voucherId,
    voucherCode: row.voucherCode,
    createdAt: row.createdAt,
    paidAt: row.paidAt,
    qrString: row.qrString,
    paymentUrl: extractPaymentUrl(row.attemptRaw),
    reference: row.reference,
    attemptExpiresAt: row.attemptExpiresAt,
    attemptStatus: row.attemptStatus,
  };
}

function extractPaymentUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const url = (raw as { paymentUrl?: unknown }).paymentUrl;
  return typeof url === "string" && url.length > 0 ? url : null;
}

export async function findOpenOrderForInvitation(invitationId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.invitationId, invitationId),
        inArray(schema.orders.status, [...OPEN_ORDER_STATUSES]),
      ),
    )
    .orderBy(desc(schema.orders.createdAt))
    .limit(1);
  return row?.id ?? null;
}

export async function expireOrderIfNeeded(orderId: string): Promise<OrderView | null> {
  const view = await getOrderView(orderId);
  if (!view) return null;
  if (view.status !== "created" && view.status !== "awaiting_payment") return view;
  const expiredAt = view.attemptExpiresAt ?? new Date(view.createdAt.getTime() + 60 * 60 * 1000);
  if (expiredAt.getTime() > Date.now()) return view;

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: schema.orders.id,
        status: schema.orders.status,
        voucherId: schema.orders.voucherId,
        invitationId: schema.orders.invitationId,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .for("update");
    if (!order || (order.status !== "created" && order.status !== "awaiting_payment")) return;
    await tx.update(schema.orders).set({ status: "expired" }).where(eq(schema.orders.id, orderId));
    await tx
      .update(schema.paymentAttempts)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(schema.paymentAttempts.orderId, orderId), eq(schema.paymentAttempts.status, "pending")));
    if (order.voucherId) await releaseVoucher(order.voucherId);
    if (order.invitationId) {
      const otherOpen = await tx
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.invitationId, order.invitationId),
            inArray(schema.orders.status, [...OPEN_ORDER_STATUSES]),
          ),
        )
        .limit(1);
      if (otherOpen.length === 0) {
        await tx
          .update(schema.invitations)
          .set({ status: "draft", updatedAt: new Date() })
          .where(eq(schema.invitations.id, order.invitationId));
      }
    }
    await writeAudit({ action: "payment.expired", entity: "order", entityId: orderId });
  });
  return getOrderView(orderId);
}

export async function createInvitationOrder(input: {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  accountType: "user" | "reseller";
  invitationId: string;
  code?: string;
  idempotencyKey: string;
}): Promise<CreateOrderResult> {
  const [existing] = await db
    .select({ id: schema.orders.id, status: schema.orders.status })
    .from(schema.orders)
    .where(eq(schema.orders.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing) {
    const view = await getOrderView(existing.id);
    return {
      ok: true,
      orderId: existing.id,
      alreadyPaid: existing.status === "paid",
      hasInvoice: !!view?.qrString,
    };
  }

  const [inv] = await db
    .select({
      id: schema.invitations.id,
      ownerId: schema.invitations.ownerId,
      status: schema.invitations.status,
      deletedAt: schema.invitations.deletedAt,
      slug: schema.invitations.slug,
    })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, input.invitationId))
    .limit(1);
  if (!inv || inv.deletedAt) return { ok: false, error: "Undangan tidak ditemukan", field: "invitation" };
  if (inv.ownerId !== input.ownerId) return { ok: false, error: "Undangan bukan milik Anda", field: "invitation" };
  if (inv.status === "active") return { ok: false, error: "Undangan sudah terbit", field: "invitation" };
  if (inv.status === "archived") return { ok: false, error: "Undangan diarsipkan", field: "invitation" };

  // Klik "bayar" ganda: pakai order terbuka yang sama (jangan gandakan tagihan).
  const openId = await findOpenOrderForInvitation(inv.id);
  if (openId) {
    const openView = await getOrderView(openId);
    return { ok: true, orderId: openId, alreadyPaid: false, hasInvoice: !!openView?.qrString };
  }

  const unitPrice = await getActivePrice(input.accountType);
  const minFinal = env.DUITKU_MIN_AMOUNT_IDR;

  let voucherId: string | null = null;
  let voucherCode: string | null = null;
  let discount = 0;
  if (input.code) {
    const check = await checkVoucher({
      code: input.code,
      accountType: input.accountType,
      unitPriceIdr: unitPrice,
      userId: input.ownerId,
      minFinalAmountIdr: minFinal,
    });
    if (!check.ok) return { ok: false, error: check.error, field: "code" };
    const redeemed = await redeemVoucher(check.voucher.id, input.ownerId);
    if (!redeemed) return { ok: false, error: "Kuota voucher habis, coba lagi", field: "code" };
    voucherId = check.voucher.id;
    voucherCode = check.voucher.code;
    discount = check.discount;
  }

  const finalAmount = unitPrice - discount;
  if (finalAmount < minFinal) {
    if (voucherId) await releaseVoucher(voucherId);
    return {
      ok: false,
      error: `Minimal pembayaran Rp${minFinal.toLocaleString("id-ID")} (minimum transaksi QRIS Duitku)`,
      field: "code",
    };
  }

  const breakdown = await computeBreakdown({
    unitPriceIdr: unitPrice,
    discountAmountIdr: discount,
    voucherCode,
  });

  const orderId = crypto.randomUUID();
  try {
    await db.insert(schema.orders).values({
      id: orderId,
      kind: "invitation",
      ownerId: input.ownerId,
      invitationId: inv.id,
      accountType: input.accountType,
      voucherId,
      voucherCode,
      ...breakdownToColumns(breakdown),
      status: "created",
      idempotencyKey: input.idempotencyKey,
    });
  } catch {
    if (voucherId) await releaseVoucher(voucherId);
    throw new Error("ORDER_INSERT_CONFLICT");
  }

  await db
    .update(schema.invitations)
    .set({ status: "awaiting_payment", updatedAt: new Date() })
    .where(eq(schema.invitations.id, inv.id));

  // Tagihan QRIS tidak langsung diterbitkan — pembeli melihat rincian dulu
  // di /bayar, lalu QR terbit saat klik "Bayar".
  return { ok: true, orderId, alreadyPaid: false, hasInvoice: false };
}

export async function createResellerUpgradeOrder(input: {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  idempotencyKey: string;
}): Promise<CreateOrderResult> {
  const [existing] = await db
    .select({ id: schema.orders.id, status: schema.orders.status })
    .from(schema.orders)
    .where(eq(schema.orders.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing) {
    const view = await getOrderView(existing.id);
    return {
      ok: true,
      orderId: existing.id,
      alreadyPaid: existing.status === "paid",
      hasInvoice: !!view?.qrString,
    };
  }

  const alreadyReseller = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, input.ownerId), eq(schema.userRoles.role, "reseller")))
    .limit(1);
  if (alreadyReseller.length > 0) return { ok: false, error: "Anda sudah reseller" };

  const enabled = await getSettingBoolean("reseller.upgrade_enabled", true);
  if (!enabled) return { ok: false, error: "Upgrade reseller sedang ditutup" };

  const price = await getSettingNumber("reseller.upgrade_price_idr", 50000);
  const minFinal = env.DUITKU_MIN_AMOUNT_IDR;
  if (price < minFinal) return { ok: false, error: "Harga upgrade di bawah minimum pembayaran" };

  const orderId = crypto.randomUUID();
  const breakdown = await computeBreakdown({ unitPriceIdr: price, discountAmountIdr: 0 });
  await db.insert(schema.orders).values({
    id: orderId,
    kind: "reseller_upgrade",
    ownerId: input.ownerId,
    accountType: "user",
    voucherId: null,
    voucherCode: null,
    ...breakdownToColumns(breakdown),
    status: "created",
    idempotencyKey: input.idempotencyKey,
  });

  // Tagihan QRIS terbit saat klik "Bayar" di /bayar.
  return { ok: true, orderId, alreadyPaid: false, hasInvoice: false };
}

async function issueInvoice(
  orderId: string,
  input: { email: string; name: string; productDetails: string },
): Promise<boolean> {
  const open = await getOpenInvoice(orderId);
  if (open?.qrString) return true;

  const [order] = await db
    .select({
      finalAmountIdr: schema.orders.finalAmountIdr,
      payableAmountIdr: schema.orders.payableAmountIdr,
      status: schema.orders.status,
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
    .limit(1);
  if (!order) return false;
  if (order.status === "paid") return true;

  // Total yang benar-benar dibayar pembeli (fee/pajak yang dibebankan ikut).
  const amountIdr = order.payableAmountIdr > 0 ? order.payableAmountIdr : order.finalAmountIdr;

  try {
    const invoice = await createInvoice({
      orderId,
      amountIdr,
      email: input.email,
      customerName: input.name,
      productDetails: input.productDetails,
    });

    // Inquiry ulang dengan merchantOrderId sama mengembalikan reference yang
    // sama — jadi attempt expired di-update, bukan diinsert ulang (hindari
    // bentrok unique index provider + provider_ref).
    const [existingAttempt] = await db
      .select({ id: schema.paymentAttempts.id })
      .from(schema.paymentAttempts)
      .where(
        and(
          eq(schema.paymentAttempts.orderId, orderId),
          eq(schema.paymentAttempts.provider, "duitku"),
          eq(schema.paymentAttempts.providerRef, invoice.reference),
        ),
      )
      .limit(1);

    const attemptValues = {
      status: "pending" as const,
      qrString: invoice.qrString,
      paymentUrl: invoice.paymentUrl,
      channel: invoice.paymentMethod,
      amountIdr,
      expiresAt: invoice.expiresAt,
      rawLast: invoice.raw,
      updatedAt: new Date(),
    };

    if (existingAttempt) {
      await db
        .update(schema.paymentAttempts)
        .set(attemptValues)
        .where(eq(schema.paymentAttempts.id, existingAttempt.id));
    } else {
      await db.insert(schema.paymentAttempts).values({
        id: crypto.randomUUID(),
        orderId,
        provider: "duitku",
        providerRef: invoice.reference,
        qrString: invoice.qrString,
        paymentUrl: invoice.paymentUrl,
        channel: invoice.paymentMethod,
        amountIdr,
        expiresAt: invoice.expiresAt,
        rawLast: invoice.raw,
      });
    }

    await db
      .update(schema.orders)
      .set({ status: "awaiting_payment" })
      .where(eq(schema.orders.id, orderId));
    return true;
  } catch {
    // Order tetap `created` — user bisa klik "Bayar lagi" (re-inquiry attempt baru).
    return false;
  }
}

export type ApplyVoucherResult =
  | { ok: true; view: OrderView }
  | { ok: false; error: string };

/** Pasang/ganti voucher pada order terbuka (halaman /bayar). */
export async function applyOrderVoucher(
  orderId: string,
  actorId: string,
  isAdmin: boolean,
  code: string,
): Promise<ApplyVoucherResult> {
  const view = await getOrderForActor(orderId, actorId, isAdmin);
  if (!view) return { ok: false, error: "Pesanan tidak ditemukan" };
  if (view.status === "paid") return { ok: false, error: "Pesanan sudah lunas — voucher tidak bisa diubah" };
  if (view.status !== "created" && view.status !== "awaiting_payment") {
    return { ok: false, error: "Pesanan tidak bisa diubah" };
  }
  if (view.kind === "reseller_upgrade") {
    return { ok: false, error: "Upgrade reseller tidak memakai voucher" };
  }

  const minFinal = env.DUITKU_MIN_AMOUNT_IDR;
  const check = await checkVoucher({
    code,
    accountType: view.accountType as "user" | "reseller",
    unitPriceIdr: view.unitPriceIdr,
    userId: view.ownerId,
    minFinalAmountIdr: minFinal,
  });
  if (!check.ok) return { ok: false, error: check.error };

  // Redeem voucher baru dulu (anti double-spend), baru lepas voucher lama.
  const redeemed = await redeemVoucher(check.voucher.id, view.ownerId);
  if (!redeemed) return { ok: false, error: "Kuota voucher habis, coba lagi" };
  if (view.voucherCode && view.ownerId === actorId) {
    const [old] = await db
      .select({ id: schema.vouchers.id })
      .from(schema.vouchers)
      .where(eq(schema.vouchers.code, view.voucherCode))
      .limit(1);
    if (old) await releaseVoucher(old.id);
  }

  const breakdown = await computeBreakdown({
    unitPriceIdr: view.unitPriceIdr,
    discountAmountIdr: check.discount,
    voucherCode: check.voucher.code,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(schema.orders)
      .set({
        voucherId: check.voucher.id,
        voucherCode: check.voucher.code,
        ...breakdownToColumns(breakdown),
      })
      .where(eq(schema.orders.id, orderId));
    // Tagihan lama memakai nominal lama → batalkan; klik "Bayar" terbitkan baru.
    await tx
      .update(schema.paymentAttempts)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(schema.paymentAttempts.orderId, orderId), eq(schema.paymentAttempts.status, "pending")));
  });

  await writeAudit({
    actorId,
    action: "order.voucher.applied",
    entity: "order",
    entityId: orderId,
    meta: { code: check.voucher.code, discount: check.discount },
  });

  const updated = await getOrderView(orderId);
  if (!updated) return { ok: false, error: "Pesanan tidak ditemukan" };
  return { ok: true, view: updated };
}

/** Lepas voucher dari order terbuka (kembali ke harga normal). */
export async function removeOrderVoucher(
  orderId: string,
  actorId: string,
  isAdmin: boolean,
): Promise<ApplyVoucherResult> {
  const view = await getOrderForActor(orderId, actorId, isAdmin);
  if (!view) return { ok: false, error: "Pesanan tidak ditemukan" };
  if (view.status === "paid") return { ok: false, error: "Pesanan sudah lunas — voucher tidak bisa diubah" };
  if (!view.voucherCode || !view.voucherId) return { ok: false, error: "Tidak ada voucher pada pesanan ini" };

  const [voucher] = await db
    .select({ id: schema.vouchers.id })
    .from(schema.vouchers)
    .where(eq(schema.vouchers.id, view.voucherId))
    .limit(1);
  if (voucher) await releaseVoucher(voucher.id);

  const breakdown = await computeBreakdown({
    unitPriceIdr: view.unitPriceIdr,
    discountAmountIdr: 0,
    voucherCode: null,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(schema.orders)
      .set({ voucherId: null, voucherCode: null, ...breakdownToColumns(breakdown) })
      .where(eq(schema.orders.id, orderId));
    await tx
      .update(schema.paymentAttempts)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(schema.paymentAttempts.orderId, orderId), eq(schema.paymentAttempts.status, "pending")));
  });

  await writeAudit({
    actorId,
    action: "order.voucher.removed",
    entity: "order",
    entityId: orderId,
    meta: { code: view.voucherCode },
  });

  const updated = await getOrderView(orderId);
  if (!updated) return { ok: false, error: "Pesanan tidak ditemukan" };
  return { ok: true, view: updated };
}

export async function getOrderForActor(
  orderId: string,
  actorId: string,
  isAdmin: boolean,
): Promise<OrderView | null> {
  const [row] = await db
    .select({ ownerId: schema.orders.ownerId })
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
    .limit(1);
  if (!row) return null;
  if (!isAdmin && row.ownerId !== actorId) return null;
  return getOrderView(orderId);
}

export type OrderStatusResult = {
  status: string;
  paid: boolean;
  invitationSlug: string | null;
  invitationStatus: string | null;
  canRetryPay: boolean;
};

export async function getOrderStatus(
  orderId: string,
  actorId: string,
  isAdmin: boolean,
): Promise<OrderStatusResult | null> {
  const view = await expireOrderIfNeeded(orderId);
  if (!view) return null;
  if (!isAdmin && view.ownerId !== actorId) return null;
  return {
    status: view.status,
    paid: view.status === "paid",
    invitationSlug: view.invitationSlug,
    invitationStatus: view.invitationStatus,
    canRetryPay: view.status === "created" || view.status === "awaiting_payment",
  };
}

export async function retryPayOrder(
  orderId: string,
  actorId: string,
  isAdmin: boolean,
  owner: { email: string; name: string },
): Promise<{ ok: boolean; error?: string }> {
  const view = await getOrderForActor(orderId, actorId, isAdmin);
  if (!view) return { ok: false, error: "Pesanan tidak ditemukan" };
  if (view.status === "paid") return { ok: false, error: "Pesanan sudah lunas" };
  if (view.status !== "created" && view.status !== "awaiting_payment" && view.status !== "expired") {
    return { ok: false, error: "Pesanan tidak bisa dibayar lagi" };
  }
  const productDetails =
    view.kind === "invitation"
      ? `Publikasi undangan ${view.invitationSlug ?? ""}`
      : "Upgrade akun menjadi reseller";
  const ok = await issueInvoice(orderId, { email: owner.email, name: owner.name, productDetails });
  if (!ok && !(await getOpenInvoice(orderId))) {
    return { ok: false, error: "Gagal membuat tagihan, coba lagi" };
  }
  return { ok: true };
}

/** Transisi paid dari webhook — panggil hanya setelah event inbox tersimpan. */
export async function markOrderPaid(input: {
  orderId: string;
  providerRef: string | null;
}): Promise<{ alreadyPaid: boolean }> {
  let alreadyPaid = false;
  const auditInfo: Array<{ ownerId: string; kind: string }> = [];

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, input.orderId))
      .for("update");
    if (!order) return;
    if (order.status === "paid") {
      alreadyPaid = true;
      return;
    }
    auditInfo.push({ ownerId: order.ownerId, kind: order.kind });

    await tx
      .update(schema.orders)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(schema.orders.id, input.orderId));

    await tx
      .update(schema.paymentAttempts)
      .set({ status: "succeeded", updatedAt: new Date() })
      .where(
        and(eq(schema.paymentAttempts.orderId, input.orderId), eq(schema.paymentAttempts.status, "pending")),
      );

    if (order.kind === "invitation" && order.invitationId) {
      const days = await getSettingNumber("invitation.default_validity_days", 365);
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await tx
        .update(schema.invitations)
        .set({ status: "active", publishedAt: new Date(), expiresAt, updatedAt: new Date() })
        .where(eq(schema.invitations.id, order.invitationId));
    }

    if (order.kind === "reseller_upgrade") {
      await tx
        .insert(schema.userRoles)
        .values({ id: crypto.randomUUID(), userId: order.ownerId, role: "reseller" })
        .onConflictDoNothing();
      await tx
        .update(schema.users)
        .set({ type: "reseller", updatedAt: new Date() })
        .where(eq(schema.users.id, order.ownerId));
    }
  });

  if (auditInfo.length > 0 && !alreadyPaid) {
    const { kind, ownerId } = auditInfo[0]!;
    await writeAudit({
      actorId: null,
      action: kind === "reseller_upgrade" ? "payment.paid.reseller_upgrade" : "payment.paid.invitation",
      entity: "order",
      entityId: input.orderId,
      meta: { providerRef: input.providerRef },
    });
    if (kind === "reseller_upgrade") {
      await writeAudit({
        actorId: null,
        action: "reseller.upgraded",
        entity: "user",
        entityId: ownerId,
      });
    }
  }
  return { alreadyPaid };
}

export async function markAttemptFailed(orderId: string): Promise<void> {
  await db
    .update(schema.paymentAttempts)
    .set({ status: "failed", updatedAt: new Date() })
    .where(and(eq(schema.paymentAttempts.orderId, orderId), eq(schema.paymentAttempts.status, "pending")));
}

export async function hasPaidOrderForInvitation(invitationId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.invitationId, invitationId), eq(schema.orders.status, "paid")))
    .limit(1);
  return rows.length > 0;
}

export async function listPayableOrdersForOwner(
  ownerId: string,
): Promise<Array<{ id: string; invitationId: string }>> {
  const rows = await db
    .select({ id: schema.orders.id, invitationId: schema.orders.invitationId })
    .from(schema.orders)
    .where(
      and(eq(schema.orders.ownerId, ownerId), inArray(schema.orders.status, [...OPEN_ORDER_STATUSES])),
    );
  return rows.filter((r) => r.invitationId !== null) as Array<{ id: string; invitationId: string }>;
}

export type OwnerOrderRow = {
  id: string;
  kind: string;
  status: string;
  payableAmountIdr: number;
  invitationId: string | null;
  invitationSlug: string | null;
  invitationTitle: string | null;
  createdAt: string;
  paidAt: string | null;
};

/** Riwayat semua order milik owner (untuk halaman Pesanan & Pembayaran). */
export async function listOrdersForOwner(ownerId: string): Promise<OwnerOrderRow[]> {
  const rows = await db
    .select({
      id: schema.orders.id,
      kind: schema.orders.kind,
      status: schema.orders.status,
      payableAmountIdr: schema.orders.payableAmountIdr,
      invitationId: schema.orders.invitationId,
      invitationSlug: schema.invitations.slug,
      invitationConfig: schema.invitations.config,
      createdAt: schema.orders.createdAt,
      paidAt: schema.orders.paidAt,
    })
    .from(schema.orders)
    .leftJoin(schema.invitations, eq(schema.orders.invitationId, schema.invitations.id))
    .where(eq(schema.orders.ownerId, ownerId))
    .orderBy(desc(schema.orders.createdAt))
    .limit(300);

  return rows.map((r) => {
    const cfg = r.invitationConfig as { seo?: { title?: string }; event?: { couple?: { brideName: string; groomName: string } } } | null;
    let title: string | null = null;
    if (cfg?.seo?.title) title = cfg.seo.title;
    else if (cfg?.event?.couple) title = `${cfg.event.couple.brideName} & ${cfg.event.couple.groomName}`;
    return {
      id: r.id,
      kind: r.kind,
      status: r.status,
      payableAmountIdr: r.payableAmountIdr,
      invitationId: r.invitationId,
      invitationSlug: r.invitationSlug,
      invitationTitle: title,
      createdAt: r.createdAt.toISOString(),
      paidAt: r.paidAt?.toISOString() ?? null,
    };
  });
}
