import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { simulatePaidCallback } from "@/modules/payments/webhook";
import { isPaymentSimulationEnabled } from "@/modules/payments/duitku";

export const instant = false;

const bodySchema = z.object({ orderId: z.uuid() });

/** Hanya mode dummy / ALLOW_PAYMENT_SIMULATION — untuk pengujian & demo. */
export async function POST(req: Request) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!(await isPaymentSimulationEnabled())) {
    return NextResponse.json({ error: "Tidak tersedia di mode produksi" }, { status: 403 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });

  const result = await simulatePaidCallback(parsed.data.orderId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, duplicate: result.duplicate });
}
