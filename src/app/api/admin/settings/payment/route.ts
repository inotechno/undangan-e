import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { getPaymentCostSettings, setPaymentCostSettings } from "@/modules/payments/pricing";
import { writeAudit } from "@/modules/audit/log";

export const instant = false;

const patchSchema = z.object({
  feePercent: z.number().min(0).max(100),
  feeBorneByBuyer: z.boolean(),
  taxPercent: z.number().min(0).max(100),
  taxBorneByBuyer: z.boolean(),
});

export async function GET() {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
  return NextResponse.json(await getPaymentCostSettings());
}

export async function PATCH(req: Request) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pengaturan fee/pajak tidak valid" }, { status: 400 });
  }

  const result = await setPaymentCostSettings(parsed.data, auth.session.user.id);
  await writeAudit({
    actorId: auth.session.user.id,
    action: "settings.payment_cost.change",
    entity: "settings",
    meta: { ...result },
  });
  return NextResponse.json({ ok: true, ...result });
}
