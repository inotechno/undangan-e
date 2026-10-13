import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { guestQrPng, verifyGuestPayload } from "@/modules/guests/qr";

export const instant = false;

type Ctx = { params: Promise<{ payload: string }> };

/**
 * QR PNG publik berdasarkan payload hasil scan (/api/guest/qr/v1.<code>.<mac>).
 * Payload di-decode URL-safe; tidak ada PII — hanya kode tamu acak.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { payload: raw } = await ctx.params;
  let payload: string;
  try {
    payload = decodeURIComponent(raw);
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const guestCode = verifyGuestPayload(payload);
  if (!guestCode) return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });

  const [guest] = await db
    .select({ id: schema.guests.id })
    .from(schema.guests)
    .where(eq(schema.guests.guestCode, guestCode))
    .limit(1);
  if (!guest) return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });

  const png = await guestQrPng(payload);
  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
