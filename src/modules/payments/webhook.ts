import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { writeAudit } from "@/modules/audit/log";
import { callbackSignature, isPaymentSimulationEnabled } from "./duitku";
import { markOrderPaid, markAttemptFailed, getOrderView } from "./orders";

export type WebhookResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string; status: number };

/**
 * Proses callback Duitku: verifikasi signature → inbox idempoten → transisi order.
 * Dipakai oleh route webhook (live) dan simulasi sandbox.
 */
export async function handleDuitkuCallback(payload: {
  merchantCode?: string;
  amount?: string | number;
  merchantOrderId?: string;
  resultCode?: string;
  reference?: string;
  signature?: string;
}): Promise<WebhookResult> {
  const orderId = payload.merchantOrderId;
  const amount = Number(payload.amount);
  const resultCode = String(payload.resultCode ?? "");
  const signature = String(payload.signature ?? "");

  if (!orderId || !Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "Payload tidak lengkap", status: 400 };
  }

  const expected = callbackSignature(amount, orderId);
  if (signature.toLowerCase() !== expected.toLowerCase()) {
    return { ok: false, error: "Signature tidak valid", status: 401 };
  }

  const eventId = payload.reference?.trim()
    ? String(payload.reference).trim()
    : `${orderId}:${amount}:${signature.slice(0, 16)}`;

  const inserted = await db
    .insert(schema.paymentEvents)
    .values({
      id: crypto.randomUUID(),
      provider: "duitku",
      eventId,
      payload: payload as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: [schema.paymentEvents.provider, schema.paymentEvents.eventId] })
    .returning({ id: schema.paymentEvents.id });
  if (inserted.length === 0) {
    return { ok: true, duplicate: true };
  }

  if (resultCode === "00") {
    await markOrderPaid({ orderId, providerRef: payload.reference ?? null });
  } else {
    await markAttemptFailed(orderId);
    await writeAudit({
      action: "payment.failed",
      entity: "order",
      entityId: orderId,
      meta: { resultCode },
    });
  }

  await db
    .update(schema.paymentEvents)
    .set({ processedAt: new Date() })
    .where(eq(schema.paymentEvents.id, inserted[0]!.id));

  return { ok: true, duplicate: false };
}

/** Simulasi callback sandbox (mode dummy / ALLOW_PAYMENT_SIMULATION): bangun payload + signature sah, lalu proses. */
export async function simulatePaidCallback(orderId: string): Promise<WebhookResult> {
  if (!isPaymentSimulationEnabled()) return { ok: false, error: "Simulasi tidak diaktifkan", status: 403 };
  const view = await getOrderView(orderId);
  if (!view) return { ok: false, error: "Pesanan tidak ditemukan", status: 404 };
  if (view.status === "paid") return { ok: true, duplicate: true };

  const reference = view.reference ?? `SIM-${orderId.slice(0, 8)}`;
  return handleDuitkuCallback({
    merchantCode: "DUMMY",
    amount: view.finalAmountIdr,
    merchantOrderId: orderId,
    resultCode: "00",
    reference,
    signature: callbackSignature(view.finalAmountIdr, orderId),
  });
}

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.paymentEvents.id })
    .from(schema.paymentEvents)
    .where(and(eq(schema.paymentEvents.eventId, eventId)))
    .orderBy(desc(schema.paymentEvents.receivedAt))
    .limit(1);
  return rows.length > 0;
}
