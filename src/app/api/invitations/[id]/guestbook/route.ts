import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionWithRoles } from "@/auth/guard";
import { db, schema } from "@/db";
import { listWishesForOwner } from "@/modules/guests/wishes";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

/** Daftar buku tamu (termasuk yang disembunyikan) — owner/admin saja. */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const [inv] = await db
    .select({ ownerId: schema.invitations.ownerId })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, id))
    .limit(1);
  if (!inv || (!auth.isAdmin && inv.ownerId !== auth.session.user.id)) {
    return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  }

  const result = await listWishesForOwner(id);
  return NextResponse.json(result);
}
