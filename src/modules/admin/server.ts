import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/auth/guard";
import type {
  AdminAuditRow,
  AdminInvitationRow,
  AdminOrderRow,
  AdminResellerRow,
  AdminUserRow,
} from "./labels";

export * from "./labels";
export type {
  AdminAuditRow,
  AdminInvitationRow,
  AdminOrderRow,
  AdminResellerRow,
  AdminUserRow,
};

async function rolesMap(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string[]>();
  const rows = await db
    .select({ userId: schema.userRoles.userId, role: schema.userRoles.role })
    .from(schema.userRoles)
    .where(sql`${schema.userRoles.userId} IN ${userIds}`);
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const list = map.get(r.userId) ?? [];
    list.push(r.role);
    map.set(r.userId, list);
  }
  return map;
}

export interface AdminOverview {
  totalUsers: number;
  resellerCount: number;
  totalInvitations: number;
  activeInvitations: number;
  paidOrders: number;
  revenueIdr: number;
  awaitingOrders: number;
  upgradePaid: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    type: string;
    status: string;
    createdAt: string;
    roles: string[];
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    actorName: string;
    createdAt: string;
  }>;
  distribution: { label: string; count: number; color: string }[];
}

export const getAdminOverview = cache(async (): Promise<AdminOverview> => {
  await requireAdmin();

  const [userStats, invStats, orderStats, distRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        resellers: sql<number>`count(*) filter (where ${schema.users.type} = 'reseller')`,
      })
      .from(schema.users),
    db
      .select({
        total: sql<number>`count(*) filter (where ${schema.invitations.deletedAt} is null)`,
        active: sql<number>`count(*) filter (where ${schema.invitations.status} = 'active' and ${schema.invitations.deletedAt} is null)`,
      })
      .from(schema.invitations),
    db
      .select({
        paid: sql<number>`count(*) filter (where ${schema.orders.status} = 'paid')`,
        revenue: sql<number>`coalesce(sum(${schema.orders.finalAmountIdr}) filter (where ${schema.orders.status} = 'paid'), 0)`,
        awaiting: sql<number>`count(*) filter (where ${schema.orders.status} in ('created','awaiting_payment'))`,
        upgradePaid: sql<number>`count(*) filter (where ${schema.orders.status} = 'paid' and ${schema.orders.kind} = 'reseller_upgrade')`,
      })
      .from(schema.orders),
    db
      .select({ type: schema.users.type, count: sql<number>`count(*)` })
      .from(schema.users)
      .groupBy(schema.users.type),
  ]);

  const recentUserRows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      type: schema.users.type,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(6);
  const roles = await rolesMap(recentUserRows.map((u) => u.id));

  const auditRows = await db
    .select({
      id: schema.auditLogs.id,
      action: schema.auditLogs.action,
      entity: schema.auditLogs.entity,
      entityId: schema.auditLogs.entityId,
      actorName: schema.users.name,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.auditLogs.actorId, schema.users.id))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(6);

  const totalUsers = Number(userStats[0]?.total ?? 0);
  const distColors: Record<string, string> = {
    user: "#0D9488",
    reseller: "#7ccbc2",
    contributor: "#d3e1e5",
  };
  const distLabels: Record<string, string> = {
    user: "User reguler",
    reseller: "Reseller",
    contributor: "Contributor",
  };

  return {
    totalUsers,
    resellerCount: Number(userStats[0]?.resellers ?? 0),
    totalInvitations: Number(invStats[0]?.total ?? 0),
    activeInvitations: Number(invStats[0]?.active ?? 0),
    paidOrders: Number(orderStats[0]?.paid ?? 0),
    revenueIdr: Number(orderStats[0]?.revenue ?? 0),
    awaitingOrders: Number(orderStats[0]?.awaiting ?? 0),
    upgradePaid: Number(orderStats[0]?.upgradePaid ?? 0),
    recentUsers: recentUserRows.map((u) => ({
      ...u,
      type: u.type,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      roles: (roles.get(u.id) ?? ["user"]).slice().sort(),
    })),
    recentAudit: auditRows.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      actorName: a.actorName ?? "system",
      createdAt: a.createdAt.toISOString(),
    })),
    distribution: ["user", "reseller", "contributor"].map((t) => ({
      label: distLabels[t] ?? t,
      count: distRows.find((r) => r.type === t) ? Number(distRows.find((r) => r.type === t)!.count) : 0,
      color: distColors[t] ?? "#d3e1e5",
    })),
  };
});

async function invitationCountsByOwner(ownerIds: string[]) {
  if (ownerIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({
      ownerId: schema.invitations.ownerId,
      n: sql<number>`count(*)`,
    })
    .from(schema.invitations)
    .where(
      and(
        sql`${schema.invitations.ownerId} IN ${ownerIds}`,
        isNull(schema.invitations.deletedAt),
      ),
    )
    .groupBy(schema.invitations.ownerId);
  return new Map(rows.map((r) => [r.ownerId, Number(r.n)]));
}

export const listAdminUsers = cache(async (): Promise<AdminUserRow[]> => {
  await requireAdmin();
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      type: schema.users.type,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(1000);
  const [roles, counts] = await Promise.all([
    rolesMap(rows.map((u) => u.id)),
    invitationCountsByOwner(rows.map((u) => u.id)),
  ]);
  return rows.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    invitationCount: counts.get(u.id) ?? 0,
    roles: (roles.get(u.id) ?? ["user"]).slice().sort(),
  }));
});

export const listAdminInvitations = cache(async (): Promise<AdminInvitationRow[]> => {
  await requireAdmin();
  const rows = await db
    .select({
      id: schema.invitations.id,
      slug: schema.invitations.slug,
      status: schema.invitations.status,
      eventType: schema.invitations.eventType,
      config: schema.invitations.config,
      updatedAt: schema.invitations.updatedAt,
      ownerName: schema.users.name,
      ownerEmail: schema.users.email,
    })
    .from(schema.invitations)
    .innerJoin(schema.users, eq(schema.invitations.ownerId, schema.users.id))
    .where(isNull(schema.invitations.deletedAt))
    .orderBy(desc(schema.invitations.updatedAt))
    .limit(300);

  return rows.map((r) => {
    const config = r.config as { seo?: { title?: string }; event?: { couple?: { brideName: string; groomName: string } } };
    const couple = config?.event?.couple;
    return {
      id: r.id,
      slug: r.slug,
      status: r.status,
      eventType: r.eventType,
      title: config?.seo?.title || (couple ? `${couple.brideName} & ${couple.groomName}` : r.slug),
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
      updatedAt: r.updatedAt.toISOString(),
    };
  });
});

export const listAdminOrders = cache(async (): Promise<AdminOrderRow[]> => {
  await requireAdmin();
  const rows = await db
    .select({
      id: schema.orders.id,
      kind: schema.orders.kind,
      status: schema.orders.status,
      finalAmountIdr: schema.orders.finalAmountIdr,
      createdAt: schema.orders.createdAt,
      paidAt: schema.orders.paidAt,
      ownerName: schema.users.name,
      ownerEmail: schema.users.email,
      invitationSlug: schema.invitations.slug,
    })
    .from(schema.orders)
    .innerJoin(schema.users, eq(schema.orders.ownerId, schema.users.id))
    .leftJoin(schema.invitations, eq(schema.orders.invitationId, schema.invitations.id))
    .orderBy(desc(schema.orders.createdAt))
    .limit(300);

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    finalAmountIdr: r.finalAmountIdr,
    ownerName: r.ownerName,
    ownerEmail: r.ownerEmail,
    invitationSlug: r.invitationSlug,
    createdAt: r.createdAt.toISOString(),
    paidAt: r.paidAt?.toISOString() ?? null,
  }));
});

export const listAdminResellers = cache(async (): Promise<AdminResellerRow[]> => {
  await requireAdmin();
  const resellerRoleRows = await db
    .select({
      userId: schema.userRoles.userId,
      createdAt: schema.userRoles.createdAt,
    })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.role, "reseller"))
    .orderBy(desc(schema.userRoles.createdAt))
    .limit(1000);
  if (resellerRoleRows.length === 0) return [];

  const userIds = resellerRoleRows.map((r) => r.userId);
  const userRows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(sql`${schema.users.id} IN ${userIds}`);
  const counts = await invitationCountsByOwner(userIds);

  const upgradeOrders = await db
    .select({
      id: schema.orders.id,
      ownerId: schema.orders.ownerId,
      paidAt: schema.orders.paidAt,
    })
    .from(schema.orders)
    .where(
      and(eq(schema.orders.kind, "reseller_upgrade"), eq(schema.orders.status, "paid")),
    )
    .orderBy(asc(schema.orders.paidAt));
  const upgradeByOwner = new Map(
    upgradeOrders.map((o) => [o.ownerId, { id: o.id, paidAt: o.paidAt?.toISOString() ?? null }]),
  );

  return userRows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    invitationCount: counts.get(u.id) ?? 0,
    upgradeOrderId: upgradeByOwner.get(u.id)?.id ?? null,
    upgradePaidAt: upgradeByOwner.get(u.id)?.paidAt ?? null,
  }));
});

export const listAdminAudit = cache(async (): Promise<AdminAuditRow[]> => {
  await requireAdmin();
  const rows = await db
    .select({
      id: schema.auditLogs.id,
      action: schema.auditLogs.action,
      entity: schema.auditLogs.entity,
      entityId: schema.auditLogs.entityId,
      meta: schema.auditLogs.meta,
      actorName: schema.users.name,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.auditLogs.actorId, schema.users.id))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(300);

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    actorName: r.actorName ?? "system",
    meta: (r.meta as Record<string, unknown>) ?? {},
    createdAt: r.createdAt.toISOString(),
  }));
});
