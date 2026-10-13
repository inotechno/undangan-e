import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { guestbookEntries, invitations, templates } from "@/db/schema";
import { env } from "@/core/config";
import { resolvePublicGuest } from "@/modules/guests/server";
import { signGuestPayload } from "@/modules/guests/qr";
import {
  InvitationRenderer,
  parseConfig,
  resolveTheme,
  getTemplate,
} from "@/modules/invitation";

type Params = { params: Promise<{ slug: string }> };
type Search = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Route publik selalu dinamis: query DB + konteks tamu per request. */
export const instant = false;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function fetchInvitation(slug: string) {
  // new Date() di query kedaluwarsa tidak stabil saat prerender — tunda ke request time.
  await connection();
  const rows = await db
    .select({
      id: invitations.id,
      eventType: invitations.eventType,
      config: invitations.config,
      expiresAt: invitations.expiresAt,
      publishedAt: invitations.publishedAt,
      templateSlug: templates.slug,
      templateName: templates.name,
      templateDescription: templates.description,
      templatePreview: templates.previewImageKey,
      templateSectionLabels: templates.sectionLabels,
    })
    .from(invitations)
    .innerJoin(templates, eq(invitations.templateId, templates.id))
    .where(
      and(
        eq(invitations.slug, slug),
        eq(invitations.status, "active"),
        isNull(invitations.deletedAt),
        or(isNull(invitations.expiresAt), gt(invitations.expiresAt, new Date())),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const row = await fetchInvitation(slug);
  if (!row) notFound();

  const config = parseConfig(row.config);
  const title = config.seo.title ?? `Undangan ${row.templateName} - UndanganE`;
  const description =
    config.seo.description ??
    (row.templateDescription ?? "Undangan digital interaktif yang indah, cepat, dan mudah dibagikan.");
  const cover = config.seo.coverImage ?? row.templatePreview ?? undefined;
  const url = `${env.APP_URL}/i/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "UndanganE",
      images: cover ? [{ url: cover, width: 1200, height: 630, alt: title }] : undefined,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function InvitationPage({ params, searchParams }: Params & Search) {
  const { slug } = await params;
  const sp = await searchParams;

  const row = await fetchInvitation(slug);
  if (!row) notFound();

  const template = getTemplate(row.templateSlug);
  const config = parseConfig(row.config);
  const theme = resolveTheme(template?.defaultTheme, config.theme);

  const sections = { ...template?.defaultSections, ...config.sections };
  const labels = (row.templateSectionLabels ?? {}) as Record<
    string,
    { eyebrow?: string; title?: string }
  >;

  // Konteks tamu: ?g=kode-tamu & ?kepada=Nama (auto-create sesuai docs/10)
  const guestName = first(sp.kepada);
  const guestCode = first(sp.g);
  const ctx = await resolvePublicGuest(row.id, { guestCode, guestName });
  const guest = ctx
    ? {
        name: ctx.name,
        code: ctx.code,
        quota: ctx.quota,
        rsvp: ctx.rsvp,
        qrPayload: signGuestPayload(ctx.code),
      }
    : null;

  const wishRows = await db
    .select({ id: guestbookEntries.id, name: guestbookEntries.name, message: guestbookEntries.message, createdAt: guestbookEntries.createdAt })
    .from(guestbookEntries)
    .where(and(eq(guestbookEntries.invitationId, row.id), eq(guestbookEntries.status, "visible")))
    .orderBy(desc(guestbookEntries.createdAt))
    .limit(10);

  const wishes = wishRows.map((w) => ({
    id: w.id,
    name: w.name,
    message: w.message,
    createdAt: w.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  }));

  const names = config.event.couple
    ? `${config.event.couple.brideName} & ${config.event.couple.groomName}`
    : (config.event.celebrant?.name ?? config.event.host?.name ?? config.event.title ?? "Undangan");
  const eventStart = new Date(config.event.date);
  const location = config.event.schedules[0]?.venue ?? "Indonesia";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: config.seo.title ?? names,
    startDate: config.event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: config.seo.coverImage ? [config.seo.coverImage] : undefined,
    description: config.seo.description ?? `Undangan ${names}`,
    location: {
      "@type": "Place",
      name: location,
      address: config.event.schedules[0]?.address ?? location,
    },
    organizer: { "@type": "Person", name: names },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <InvitationRenderer
        config={config}
        theme={theme}
        layout={template?.layout ?? "full_bleed"}
        sections={sections}
        guest={guest}
        wishes={wishes}
        mode="live"
        labels={labels}
        slug={slug}
      />
      <p className="sr-only">
        Dibuat pada {eventStart.toLocaleDateString("id-ID")}.
      </p>
    </>
  );
}
