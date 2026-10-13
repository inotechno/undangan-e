import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";
import { getOrderView, retryPayOrder } from "@/modules/payments/orders";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;
  const result = await retryPayOrder(id, auth.session.user.id, auth.isAdmin, {
    email: auth.session.user.email,
    name: auth.session.user.name || auth.session.user.email,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const view = await getOrderView(id);
  return NextResponse.json({
    ok: true,
    qrString: view?.qrString ?? null,
    paymentUrl: view?.paymentUrl ?? null,
    reference: view?.reference ?? null,
    expiresAt: view?.attemptExpiresAt?.toISOString() ?? null,
    payableAmountIdr: view?.payableAmountIdr ?? null,
  });
}
