import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import {
  configPatchSchema,
  getInvitationForActor,
  patchInvitation,
  softDeleteInvitation,
} from "@/modules/invitations/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const item = await getInvitationForActor(id, auth.session.user.id, auth.isAdmin);
  if (!item) return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = configPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const result = await patchInvitation(
    id,
    auth.session.user.id,
    auth.isAdmin,
    parsed.data,
    ip,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, field: result.field },
      { status: result.field === "slug" ? 409 : 400 },
    );
  }
  return NextResponse.json({ updatedAt: result.updatedAt });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const result = await softDeleteInvitation(id, auth.session.user.id, auth.isAdmin);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
