import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSessionWithRoles } from "@/auth/guard";
import { writeAudit } from "@/modules/audit/log";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  action: z.enum(["suspend", "unsuspend", "grant_reseller", "revoke_reseller"]),
  reason: z.string().min(3).max(500).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });

  const actorId = auth.session.user.id;
  const { id } = await ctx.params;
  if (id === actorId) {
    return NextResponse.json({ error: "Tidak dapat mengubah akun sendiri" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const { action, reason } = parsed.data;

  const [target] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      type: schema.users.type,
      status: schema.users.status,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });

  if ((action === "suspend" || action === "revoke_reseller") && !reason) {
    return NextResponse.json({ error: "Alasan wajib diisi" }, { status: 400 });
  }

  if (action === "suspend") {
    if (target.status === "suspended") {
      return NextResponse.json({ error: "Sudah suspended" }, { status: 400 });
    }
    await db
      .update(schema.users)
      .set({ status: "suspended", updatedAt: new Date() })
      .where(eq(schema.users.id, id));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
    await writeAudit({
      actorId,
      action: "admin.user.suspend",
      entity: "user",
      entityId: id,
      meta: { email: target.email, reason },
    });
    return NextResponse.json({ ok: true, status: "suspended" });
  }

  if (action === "unsuspend") {
    if (target.status === "active") {
      return NextResponse.json({ error: "Sudah aktif" }, { status: 400 });
    }
    await db
      .update(schema.users)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(schema.users.id, id));
    await writeAudit({
      actorId,
      action: "admin.user.unsuspend",
      entity: "user",
      entityId: id,
      meta: { email: target.email },
    });
    return NextResponse.json({ ok: true, status: "active" });
  }

  if (action === "grant_reseller") {
    const [existing] = await db
      .select({ id: schema.userRoles.id })
      .from(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, id), eq(schema.userRoles.role, "reseller")))
      .limit(1);
    if (existing) return NextResponse.json({ error: "Sudah berstatus reseller" }, { status: 400 });
    await db.insert(schema.userRoles).values({ userId: id, role: "reseller" });
    if (target.type !== "reseller") {
      await db
        .update(schema.users)
        .set({ type: "reseller", updatedAt: new Date() })
        .where(eq(schema.users.id, id));
    }
    await writeAudit({
      actorId,
      action: "admin.user.grant_reseller",
      entity: "user",
      entityId: id,
      meta: { email: target.email, reason: reason ?? null },
    });
    return NextResponse.json({ ok: true, roles: ["reseller"] });
  }

  // revoke_reseller
  const [existing] = await db
    .delete(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, id), eq(schema.userRoles.role, "reseller")))
    .returning({ id: schema.userRoles.id });
  if (!existing) {
    return NextResponse.json({ error: "Bukan reseller" }, { status: 400 });
  }
  if (target.type === "reseller") {
    await db
      .update(schema.users)
      .set({ type: "user", updatedAt: new Date() })
      .where(eq(schema.users.id, id));
  }
  await writeAudit({
    actorId,
    action: "admin.user.revoke_reseller",
    entity: "user",
    entityId: id,
    meta: { email: target.email, reason },
  });
  return NextResponse.json({ ok: true, roles: ["user"] });
}
