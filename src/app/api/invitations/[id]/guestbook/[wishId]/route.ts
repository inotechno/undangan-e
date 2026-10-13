import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionWithRoles } from "@/auth/guard";
import { db, schema } from "@/db";
import { deleteWish, moderateWish, wishModerationSchema } from "@/modules/guests/wishes";

export const instant = false;

type Ctx = { params: Promise<{ id: string; wishId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id, wishId } = await ctx.params;

  const [inv] = await db
    .select({ ownerId: schema.invitations.ownerId })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, id))
    .limit(1);
  if (!inv || (!auth.isAdmin && inv.ownerId !== auth.session.user.id)) {
    return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = wishModerationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });

  const result = await moderateWish(id, wishId, parsed.data.status);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id, wishId } = await ctx.params;

  const [inv] = await db
    .select({ ownerId: schema.invitations.ownerId })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, id))
    .limit(1);
  if (!inv || (!auth.isAdmin && inv.ownerId !== auth.session.user.id)) {
    return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  }

  const result = await deleteWish(id, wishId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
