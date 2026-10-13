import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSessionWithRoles } from "@/auth/guard";
import { writeAudit } from "@/modules/audit/log";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().min(3).max(500),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });

  const actorId = auth.session.user.id;
  const { id } = await ctx.params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Alasan pembatalan wajib diisi" }, { status: 400 });
  }
  const { reason } = parsed.data;

  const [existing] = await db
    .select({
      id: schema.orders.id,
      status: schema.orders.status,
      kind: schema.orders.kind,
      finalAmountIdr: schema.orders.finalAmountIdr,
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  if (existing.status !== "created" && existing.status !== "awaiting_payment") {
    return NextResponse.json(
      { error: "Hanya order yang belum dibayar yang bisa dibatalkan" },
      { status: 400 },
    );
  }

  await db
    .update(schema.orders)
    .set({ status: "cancelled" })
    .where(eq(schema.orders.id, id));
  await writeAudit({
    actorId,
    action: "admin.order.cancel",
    entity: "order",
    entityId: id,
    meta: { kind: existing.kind, amountIdr: existing.finalAmountIdr, reason },
  });
  return NextResponse.json({ ok: true, status: "cancelled" });
}
