import { NextResponse } from "next/server";
import { getSessionWithRoles } from "@/auth/guard";

export const instant = false;

/** Info sesi + role untuk pengambilan keputusan redirect di client. */
export async function GET() {
  const data = await getSessionWithRoles();
  if (!data) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: data.session.user.id,
      name: data.session.user.name,
      email: data.session.user.email,
    },
    roles: data.roles,
    isAdmin: data.isAdmin,
  });
}
