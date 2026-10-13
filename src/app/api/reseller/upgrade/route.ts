import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { createResellerUpgradeOrder } from "@/modules/payments/orders";
import { getSettingNumber, getSettingBoolean } from "@/modules/payments/pricing";

export const instant = false;

const bodySchema = z.object({ idempotencyKey: z.string().min(8).max(128) });

export async function POST(req: Request) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });

  const result = await createResellerUpgradeOrder({
    ownerId: auth.session.user.id,
    ownerEmail: auth.session.user.email,
    ownerName: auth.session.user.name || auth.session.user.email,
    idempotencyKey: parsed.data.idempotencyKey,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(
    { orderId: result.orderId, alreadyPaid: result.alreadyPaid, hasInvoice: result.hasInvoice },
    { status: 201 },
  );
}

export async function GET() {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const isReseller = auth.roles.includes("reseller");
  const price = await getSettingNumber("reseller.upgrade_price_idr", 50000);
  const enabled = await getSettingBoolean("reseller.upgrade_enabled", true);
  return NextResponse.json({ isReseller, priceIdr: price, enabled });
}
