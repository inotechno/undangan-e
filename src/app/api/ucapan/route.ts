import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/auth/guard";
import { listWishesForOwnerAll, moderateWishByOwner, deleteWishByOwner } from "@/modules/guests/wishes";

export const instant = false;

export async function GET() {
  const { session } = await requireAuth();
  const data = await listWishesForOwnerAll(session.user.id);
  return NextResponse.json(data);
}

const patchSchema = z.object({ wishId: z.uuid(), status: z.enum(["visible", "hidden"]) });

export async function PATCH(req: Request) {
  const { session } = await requireAuth();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const result = await moderateWishByOwner(session.user.id, parsed.data.wishId, parsed.data.status);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

const delSchema = z.object({ wishId: z.uuid() });

export async function DELETE(req: Request) {
  const { session } = await requireAuth();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = delSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const result = await deleteWishByOwner(session.user.id, parsed.data.wishId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
