import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import { getOrderForActor } from "@/modules/payments/orders";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;
  const view = await getOrderForActor(id, auth.session.user.id, auth.isAdmin);
  if (!view) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(view);
}
