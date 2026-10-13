import { NextResponse } from "next/server";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { rsvpSchema, submitRsvp } from "@/modules/guests/wishes";

export const instant = false;

type Ctx = { params: Promise<{ slug: string }> };

/** Cari undangan aktif by slug (publik). */
async function findActiveInvitation(slug: string) {
  const [row] = await db
    .select({ id: schema.invitations.id })
    .from(schema.invitations)
    .where(
      and(
        eq(schema.invitations.slug, slug),
        eq(schema.invitations.status, "active"),
        isNull(schema.invitations.deletedAt),
        or(isNull(schema.invitations.expiresAt), gt(schema.invitations.expiresAt, new Date())),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const inv = await findActiveInvitation(slug);
  if (!inv) return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const result = await submitRsvp(inv.id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, rsvp: result.rsvp });
}
