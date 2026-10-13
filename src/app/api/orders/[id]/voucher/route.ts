import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { applyOrderVoucher, removeOrderVoucher } from "@/modules/payments/orders";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = z.object({ code: z.string().trim().min(1).max(64) }).safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Kode voucher tidak valid" }, { status: 400 });

  const result = await applyOrderVoucher(id, auth.session.user.id, auth.isAdmin, parsed.data.code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, breakdown: result.view });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;
  const result = await removeOrderVoucher(id, auth.session.user.id, auth.isAdmin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, breakdown: result.view });
}
