import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { checkVoucher } from "@/modules/payments/vouchers";
import { getActivePrice } from "@/modules/payments/pricing";
import { env } from "@/core/config";

export const instant = false;

const bodySchema = z.object({
  code: z.string().min(1).max(64),
  invitationId: z.uuid().optional(),
});

/** Cek voucher tanpa redeem — untuk preview diskon di checkout. */
export async function POST(req: Request) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });

  const accountType = auth.roles.includes("reseller") ? "reseller" : "user";
  const unitPrice = await getActivePrice(accountType);
  const result = await checkVoucher({
    code: parsed.data.code,
    accountType,
    unitPriceIdr: unitPrice,
    userId: auth.session.user.id,
    minFinalAmountIdr: env.DUITKU_MIN_AMOUNT_IDR,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({
    ok: true,
    code: result.voucher.code,
    unitPriceIdr: unitPrice,
    discountIdr: result.discount,
    finalAmountIdr: result.final,
  });
}
