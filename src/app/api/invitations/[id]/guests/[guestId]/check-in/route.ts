import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import { checkInGuest } from "@/modules/guests/server";

export const instant = false;

type Params = { params: Promise<{ id: string; guestId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id, guestId } = await params;
  const result = await checkInGuest(id, guestId, auth.session.user.id, auth.isAdmin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, duplicate: result.duplicate, guest: result.guest });
}
