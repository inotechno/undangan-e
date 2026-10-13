import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import type { UserRole } from "@/db/schema";
import { getSession } from "./auth";

export const getRolesForUser = cache(async (userId: string): Promise<UserRole[]> => {
  const rows = await db
    .select({ role: schema.userRoles.role })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.userId, userId));
  return rows.map((r) => r.role);
});

export const requireAuth = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/masuk");
  }
  const roles = await getRolesForUser(session.user.id);
  return { session, roles };
});

export async function requireRole(role: UserRole) {
  const { session, roles } = await requireAuth();
  if (!roles.includes(role)) {
    throw new Error("FORBIDDEN");
  }
  return { session, roles };
}

export async function requireAdmin() {
  return requireRole("admin");
}

/** Untuk route handler API: kembalikan null (401) alih-alih redirect. */
export async function getSessionWithRoles() {
  const session = await getSession();
  if (!session) return null;
  const roles = await getRolesForUser(session.user.id);
  return { session, roles, isAdmin: roles.includes("admin") };
}

export function canEditInvitation(
  roles: UserRole[],
  ownerId: string,
  actorId: string,
): boolean {
  if (roles.includes("admin")) return true;
  return ownerId === actorId;
}
