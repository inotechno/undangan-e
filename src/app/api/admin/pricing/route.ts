import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { setActivePrice, listActivePrices } from "@/modules/payments/pricing";
import { writeAudit } from "@/modules/audit/log";

export const instant = false;

export async function GET() {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
  const prices = await listActivePrices();
  return NextResponse.json(prices);
}

const postSchema = z.object({
  accountType: z.enum(["user", "reseller"]),
  amountIdr: z.number().int().min(1000).max(10_000_000),
});

export async function POST(req: Request) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Harga tidak valid" }, { status: 400 });

  const result = await setActivePrice(parsed.data.accountType, parsed.data.amountIdr, auth.session.user.id);
  await writeAudit({
    actorId: auth.session.user.id,
    action: "price.change",
    entity: "pricing_rules",
    entityId: parsed.data.accountType,
    meta: { amountIdr: result.amountIdr },
  });
  return NextResponse.json({ ok: true, amountIdr: result.amountIdr });
}
