import { db, schema } from "@/db";

export interface AuditInput {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    actorId: input.actorId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    meta: input.meta ?? {},
    ip: input.ip ?? null,
  });
}
