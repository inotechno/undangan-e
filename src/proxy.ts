import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/core/rate-limit";

/** Kelas rate limit: [pola path, limit, jendela detik]. Urutan = prioritas. */
const RULES: Array<[RegExp, number, number]> = [
  // Auth (sign-in/sign-up/reset) — ketat, IP.
  [/^\/api\/auth\//, 15, 300],
  // Tulisan publik (RSVP, buku tamu, ucapan) — anti-spam.
  [/^\/api\/(i\/[^/]+\/(rsvp|guestbook)|ucapan|buku-tamu)(\/|$)/, 30, 60],
];
const DEFAULT_LIMIT: [number, number] = [120, 60];

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export default async function proxy(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const path = req.nextUrl.pathname;

  // Webhook pembayaran wajib selalu diterima (signature sudah divalidasi di handler).
  if (path.startsWith("/api/webhooks/")) return NextResponse.next();

  const ip = clientIp(req);
  const [rule, limit, windowSec] = RULES.find(([re]) => re.test(path)) ?? [null, ...DEFAULT_LIMIT] as [null, number, number];
  const bucket = rule ? `api:${rule.source}:${ip}` : `api:default:${ip}`;

  const res = await rateLimit(bucket, limit, windowSec);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(res.retryAfter), "X-RateLimit-Limit": String(limit) } },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
