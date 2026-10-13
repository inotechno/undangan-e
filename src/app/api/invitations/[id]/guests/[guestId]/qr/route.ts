import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSessionWithRoles } from "@/auth/guard";
import { db, schema } from "@/db";
import { parseConfig } from "@/modules/invitation";
import { buildQrPassInfo, guestQrPassPng, signGuestPayload } from "@/modules/guests/qr";

export const instant = false;

type Ctx = { params: Promise<{ id: string; guestId: string }> };

/** Kartu tiket QR tamu (PNG) untuk diunduh/dibagikan pemilik — info acara & tamu jelas. */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id, guestId } = await ctx.params;

  const [inv] = await db
    .select({ ownerId: schema.invitations.ownerId, config: schema.invitations.config })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, id))
    .limit(1);
  if (!inv || (!auth.isAdmin && inv.ownerId !== auth.session.user.id)) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  const [guest] = await db
    .select({
      guestCode: schema.guests.guestCode,
      name: schema.guests.name,
      quota: schema.guests.quota,
    })
    .from(schema.guests)
    .where(and(eq(schema.guests.id, guestId), eq(schema.guests.invitationId, id)))
    .limit(1);
  if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });

  const cfg = parseConfig(inv.config);
  const info = buildQrPassInfo(cfg, guest);
  const png = await guestQrPassPng(signGuestPayload(guest.guestCode), info);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="tiket-${guest.guestCode}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
