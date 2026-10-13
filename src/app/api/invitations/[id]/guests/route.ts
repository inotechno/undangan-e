import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import { env } from "@/core/config";
import {
  createGuest,
  guestCreateSchema,
  guestListQuerySchema,
  listGuests,
} from "@/modules/guests/server";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const url = new URL(req.url);
  const parsed = guestListQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    source: url.searchParams.get("source") ?? undefined,
    rsvp: url.searchParams.get("rsvp") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Filter tidak valid" }, { status: 400 });

  const result = await listGuests(id, auth.session.user.id, auth.isAdmin, parsed.data, env.APP_URL);
  if (!result) return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(result);
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = guestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const result = await createGuest(id, auth.session.user.id, auth.isAdmin, parsed.data, env.APP_URL);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.guest, { status: 201 });
}
