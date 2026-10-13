import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { createOrderSchema, createInvitationOrder } from "@/modules/payments/orders";

export const instant = false;

const bodySchema = createOrderSchema.extend({ invitationId: z.uuid() });

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
  if (!parsed.success) {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const accountType = auth.roles.includes("reseller") ? "reseller" : "user";
  try {
    const result = await createInvitationOrder({
      ownerId: auth.session.user.id,
      ownerEmail: auth.session.user.email,
      ownerName: auth.session.user.name || auth.session.user.email,
      accountType,
      invitationId: parsed.data.invitationId,
      code: parsed.data.code,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error, field: result.field }, { status: 400 });
    }
    return NextResponse.json(
      { orderId: result.orderId, alreadyPaid: result.alreadyPaid, hasInvoice: result.hasInvoice },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Gagal membuat pesanan, coba lagi" }, { status: 500 });
  }
}
