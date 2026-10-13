import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import { publishInvitation } from "@/modules/invitations/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const result = await publishInvitation(id, auth.session.user.id, auth.isAdmin);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, slug: result.slug });
}
