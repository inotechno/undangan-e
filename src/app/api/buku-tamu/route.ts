import { NextResponse } from "next/server";
import { requireAuth } from "@/auth/guard";
import { listCheckInsForOwner } from "@/modules/guests/server";

export const instant = false;

export async function GET(req: Request) {
  const { session } = await requireAuth();
  const url = new URL(req.url);
  const invitationId = url.searchParams.get("invitationId") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const data = await listCheckInsForOwner(session.user.id, { invitationId, q });
  return NextResponse.json(data);
}
