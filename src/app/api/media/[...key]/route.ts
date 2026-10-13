import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getObject } from "@/modules/media/storage";

type Ctx = { params: Promise<{ key: string[] }> };

const KEY_RE = /^u\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/;

export async function GET(_req: Request, ctx: Ctx) {
  const { key: parts } = await ctx.params;
  const key = parts.map((p) => decodeURIComponent(p)).join("/");
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "Key tidak valid" }, { status: 400 });
  }

  // Hanya key yang tercatat di media_assets yang bisa disajikan.
  const rows = await db
    .select({ mime: schema.mediaAssets.mime })
    .from(schema.mediaAssets)
    .where(eq(schema.mediaAssets.key, key))
    .limit(1)
    .catch(() => []);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Media tidak ditemukan" }, { status: 404 });
  }

  const obj = await getObject(key);
  if (!obj) {
    return NextResponse.json({ error: "Media tidak ditemukan" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(obj.body), {
    headers: {
      "Content-Type": rows[0]?.mime ?? obj.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
