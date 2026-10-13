import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import { importGuests } from "@/modules/guests/server";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as { csv?: unknown } | null;
  const csv = typeof body?.csv === "string" ? body.csv : null;
  if (!csv || !csv.trim()) {
    return NextResponse.json({ error: "Konten CSV kosong" }, { status: 400 });
  }

  const result = await importGuests(id, auth.session.user.id, auth.isAdmin, csv);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
