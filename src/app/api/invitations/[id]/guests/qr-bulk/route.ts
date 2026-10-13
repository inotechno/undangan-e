import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import JSZip from "jszip";
import { getSessionWithRoles } from "@/auth/guard";
import { db, schema } from "@/db";
import { parseConfig } from "@/modules/invitation";
import { buildQrPassInfo, guestQrPassPng, signGuestPayload } from "@/modules/guests/qr";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

const MAX_GUESTS = 500;

/** Unduh massal kartu tiket QR semua tamu (ZIP berisi PNG). */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const [inv] = await db
    .select({ ownerId: schema.invitations.ownerId, config: schema.invitations.config })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, id))
    .limit(1);
  if (!inv || (!auth.isAdmin && inv.ownerId !== auth.session.user.id)) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  const guests = await db
    .select({
      guestCode: schema.guests.guestCode,
      name: schema.guests.name,
      quota: schema.guests.quota,
    })
    .from(schema.guests)
    .where(eq(schema.guests.invitationId, id))
    .orderBy(asc(schema.guests.name))
    .limit(MAX_GUESTS);
  if (guests.length === 0) return NextResponse.json({ error: "Belum ada tamu" }, { status: 400 });

  const cfg = parseConfig(inv.config);
  const zip = new JSZip();
  const folder = zip.folder("tiket-qr") ?? zip;

  for (const guest of guests) {
    const info = buildQrPassInfo(cfg, guest);
    const png = await guestQrPassPng(signGuestPayload(guest.guestCode), info);
    folder.file(`tiket-${guest.guestCode}.png`, png);
  }

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="tiket-qr-${id.slice(0, 8)}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
