import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/auth/guard";
import { db, schema } from "@/db";
import { getInvitationForActor } from "@/modules/invitations/server";
import { findOpenOrderForInvitation } from "@/modules/payments/orders";
import { getTemplate } from "@/modules/invitation";
import type { SectionLabels } from "@/modules/invitation";
import { InvitationEditor, type EditorInitial } from "@/modules/editor/editor";

export const metadata: Metadata = {
  title: "Editor Undangan",
  robots: { index: false, follow: false },
};

/** Editor privat: selalu dinamis (sesi + data undangan per request). */
export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function EditorPage({ params }: Props) {
  const { session, roles } = await requireAuth();
  const { id } = await params;

  const invitation = await getInvitationForActor(id, session.user.id, roles.includes("admin"));
  if (!invitation) notFound();

  const tpl = getTemplate(invitation.templateSlug);
  if (!tpl) notFound();

  const [tplRow] = await db
    .select({ sectionLabels: schema.templates.sectionLabels })
    .from(schema.templates)
    .where(eq(schema.templates.slug, invitation.templateSlug))
    .limit(1);

  const pendingOrderId = await findOpenOrderForInvitation(invitation.id);

  const initial: EditorInitial = {
    id: invitation.id,
    slug: invitation.slug,
    status: invitation.status,
    config: invitation.config,
    pendingOrderId,
    template: {
      name: tpl.name,
      layout: tpl.layout,
      defaultTheme: tpl.defaultTheme,
      defaultSections: tpl.defaultSections,
      sectionLabels: (tplRow?.sectionLabels ?? {}) as SectionLabels,
    },
  };

  return <InvitationEditor initial={initial} />;
}
