import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionWithRoles } from "@/auth/guard";
import { EVENT_TYPES } from "@/modules/invitation";
import { createInvitation, listInvitations } from "@/modules/invitations/server";

export async function GET() {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const items = await listInvitations(auth.session.user.id);
  return NextResponse.json({ items });
}

const createSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().trim().min(2, "Nama undangan minimal 2 karakter").max(80),
  eventType: z.enum(EVENT_TYPES).optional(),
});

export async function POST(req: Request) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
      { status: 400 },
    );
  }

  try {
    const created = await createInvitation({
      ownerId: auth.session.user.id,
      templateId: parsed.data.templateId,
      title: parsed.data.title,
      eventType: parsed.data.eventType,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "TEMPLATE_NOT_FOUND") {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }
    throw err;
  }
}
