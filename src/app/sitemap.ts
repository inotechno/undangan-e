import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { eq } from "drizzle-orm";
import { env } from "@/core/config";
import { db, schema } from "@/db";

async function getPublishedInvitationUrls() {
  "use cache";
  cacheLife("hours");
  try {
    const invitations = await db
      .select({
        slug: schema.invitations.slug,
        updatedAt: schema.invitations.updatedAt,
      })
      .from(schema.invitations)
      .where(eq(schema.invitations.status, "active"))
      .limit(5000);

    return invitations.map((inv) => ({
      slug: inv.slug,
      updatedAt: inv.updatedAt?.toISOString() ?? null,
    }));
  } catch {
    return [] as Array<{ slug: string; updatedAt: string | null }>;
  }
}

async function getActiveTemplateSlugs() {
  "use cache";
  cacheLife("hours");
  try {
    const rows = await db
      .select({ slug: schema.templates.slug })
      .from(schema.templates)
      .where(eq(schema.templates.status, "active"))
      .limit(200);
    return rows.map((r) => r.slug);
  } catch {
    return [] as string[];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.APP_URL;
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/template`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/harga`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/panduan`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const invitations = await getPublishedInvitationUrls();
  const invitationEntries: MetadataRoute.Sitemap = invitations.map((inv) => ({
    url: `${siteUrl}/i/${inv.slug}`,
    lastModified: inv.updatedAt ? new Date(inv.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const templateSlugs = await getActiveTemplateSlugs();
  const templateEntries: MetadataRoute.Sitemap = templateSlugs.map((slug) => ({
    url: `${siteUrl}/template/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...templateEntries, ...invitationEntries];
}
