import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import { deleteGuest, guestPatchSchema, updateGuest } from "@/modules/guests/server";

export const instant = false;

type Ctx = { params: Promise<{ id: string; guestId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id, guestId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = guestPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const result = await updateGuest(id, guestId, auth.session.user.id, auth.isAdmin, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id, guestId } = await ctx.params;

  const result = await deleteGuest(id, guestId, auth.session.user.id, auth.isAdmin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
