import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSessionWithRoles } from "@/auth/guard";
import { writeAudit } from "@/modules/audit/log";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  action: z.enum(["archive", "restore", "unpublish"]),
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
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const { action } = parsed.data;

  const [existing] = await db
    .select({
      id: schema.invitations.id,
      slug: schema.invitations.slug,
      status: schema.invitations.status,
    })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  }

  if (action === "archive") {
    if (existing.status === "archived") {
      return NextResponse.json({ error: "Sudah diarsipkan" }, { status: 400 });
    }
    await db
      .update(schema.invitations)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(schema.invitations.id, id));
    await writeAudit({
      actorId,
      action: "admin.invitation.archive",
      entity: "invitation",
      entityId: id,
      meta: { slug: existing.slug },
    });
    return NextResponse.json({ ok: true, status: "archived" });
  }

  if (action === "restore") {
    if (existing.status !== "archived") {
      return NextResponse.json({ error: "Bukan undangan terarsip" }, { status: 400 });
    }
    await db
      .update(schema.invitations)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(schema.invitations.id, id));
    await writeAudit({
      actorId,
      action: "admin.invitation.restore",
      entity: "invitation",
      entityId: id,
      meta: { slug: existing.slug },
    });
    return NextResponse.json({ ok: true, status: "draft" });
  }

  // unpublish: active → draft (undangan offline tanpa soft-delete)
  if (existing.status !== "active") {
    return NextResponse.json({ error: "Hanya undangan aktif yang bisa dicabut publikasinya" }, { status: 400 });
  }
  await db
    .update(schema.invitations)
    .set({ status: "draft", publishedAt: null, updatedAt: new Date() })
    .where(eq(schema.invitations.id, id));
  await writeAudit({
    actorId,
    action: "admin.invitation.unpublish",
    entity: "invitation",
    entityId: id,
    meta: { slug: existing.slug },
  });
  return NextResponse.json({ ok: true, status: "draft" });
}
