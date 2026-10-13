import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSessionWithRoles } from "@/auth/guard";
import { writeAudit } from "@/modules/audit/log";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({ active: z.boolean() });

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
  const { id } = await ctx.params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });

  const [updated] = await db
    .update(schema.vouchers)
    .set({ active: parsed.data.active, updatedAt: new Date() })
    .where(eq(schema.vouchers.id, id))
    .returning({ id: schema.vouchers.id, code: schema.vouchers.code, active: schema.vouchers.active });
  if (!updated) return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 });

  await writeAudit({
    actorId: auth.session.user.id,
    action: parsed.data.active ? "voucher.enable" : "voucher.disable",
    entity: "voucher",
    entityId: id,
    meta: { code: updated.code },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
  const { id } = await ctx.params;

  const [existing] = await db
    .select({
      id: schema.vouchers.id,
      code: schema.vouchers.code,
      usedCount: schema.vouchers.usedCount,
    })
    .from(schema.vouchers)
    .where(eq(schema.vouchers.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 });
  if (existing.usedCount > 0) {
    return NextResponse.json(
      { error: "Voucher sudah pernah dipakai — nonaktifkan saja, jangan hapus" },
      { status: 400 },
    );
  }

  await db.delete(schema.vouchers).where(eq(schema.vouchers.id, id));
  await writeAudit({
    actorId: auth.session.user.id,
    action: "voucher.delete",
    entity: "voucher",
    entityId: id,
    meta: { code: existing.code },
  });
  return NextResponse.json({ ok: true });
}
