import { NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSessionWithRoles } from "@/auth/guard";
import { writeAudit } from "@/modules/audit/log";
import { normalizeVoucherCode } from "@/modules/payments/vouchers";

export const instant = false;

export async function GET() {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
  const rows = await db
    .select()
    .from(schema.vouchers)
    .orderBy(desc(schema.vouchers.createdAt))
    .limit(200);
  return NextResponse.json(rows);
}

const createSchema = z.object({
  code: z.string().min(3).max(32).transform(normalizeVoucherCode),
  type: z.enum(["percent", "nominal"]),
  value: z.number().int().min(1),
  maxDiscountIdr: z.number().int().min(1).nullish(),
  minOrderIdr: z.number().int().min(0).default(0),
  appliesTo: z.enum(["all", "user", "reseller"]).default("all"),
  maxTotalUses: z.number().int().min(1).nullish(),
  maxUsesPerUser: z.number().int().min(1).nullish(),
  validUntil: z.iso.datetime().nullish(),
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
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data voucher tidak valid" }, { status: 400 });
  }
  if (parsed.data.type === "percent" && parsed.data.value > 100) {
    return NextResponse.json({ error: "Persen maksimal 100" }, { status: 400 });
  }
  const [created] = await db
    .insert(schema.vouchers)
    .values({
      id: crypto.randomUUID(),
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      maxDiscountIdr: parsed.data.maxDiscountIdr ?? null,
      minOrderIdr: parsed.data.minOrderIdr,
      appliesTo: parsed.data.appliesTo,
      maxTotalUses: parsed.data.maxTotalUses ?? null,
      maxUsesPerUser: parsed.data.maxUsesPerUser ?? null,
      validFrom: new Date(),
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      active: true,
      createdBy: auth.session.user.id,
    })
    .returning();
  await writeAudit({
    actorId: auth.session.user.id,
    action: "voucher.create",
    entity: "voucher",
    entityId: created!.id,
    meta: { code: created!.code },
  });
  return NextResponse.json(created, { status: 201 });
}
