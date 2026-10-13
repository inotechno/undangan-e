import { NextResponse } from "next/server";
import { handleDuitkuCallback } from "@/modules/payments/webhook";

export const instant = false;

/**
 * Callback Duitku dikirim sebagai POST `application/x-www-form-urlencoded`
 * (lihat docs.duitku.com — "Parameter Callback"). Kita juga menerima JSON
 * agar simulasi lokal tetap jalan.
 */
async function parseBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  const text = await req.text();
  if (!text) return {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(text);
    const out: Record<string, string> = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }

  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (typeof v === "string") out[k] = v;
      else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
    }
    return out;
  } catch {
    // Fallback: coba parse sebagai form juga (konten-type kadang keliru)
    const params = new URLSearchParams(text);
    const out: Record<string, string> = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
}

export async function POST(req: Request) {
  const body = await parseBody(req);
  const result = await handleDuitkuCallback({
    merchantCode: body.merchantCode,
    amount: body.amount,
    merchantOrderId: body.merchantOrderId,
    resultCode: body.resultCode,
    reference: body.reference,
    signature: body.signature,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  // Duitku minta 200 cepat; duplikat tetap 200.
  return NextResponse.json({ ok: true, duplicate: result.duplicate });
}
