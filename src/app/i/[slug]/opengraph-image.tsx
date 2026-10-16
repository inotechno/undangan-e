import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { connection } from "next/server";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { invitations, templates } from "@/db/schema";
import { parseConfig } from "@/modules/invitation";

export const alt = "Undangan digital UndanganE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EVENT_LABEL: Record<string, string> = {
  pernikahan: "Undangan Pernikahan",
  tunangan: "Undangan Tunangan",
  ulang_tahun: "Undangan Ulang Tahun",
  aqiqah: "Undangan Aqiqah",
  khitan: "Undangan Khitanan",
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();

  const rows = await db
    .select({
      eventType: invitations.eventType,
      config: invitations.config,
      templateName: templates.name,
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

  const row = rows[0];
  const config = row ? parseConfig(row.config) : null;

  const names = config?.event.couple
    ? `${config.event.couple.brideName} & ${config.event.couple.groomName}`
    : (config?.event.celebrant?.name ?? config?.event.host?.name ?? config?.event.title ?? row?.templateName ?? "Undangan");
  const title = config?.seo.title ?? names;
  const dateLabel = config
    ? new Date(config.event.date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const eyebrow = EVENT_LABEL[row?.eventType ?? "pernikahan"] ?? "Undangan Digital";

  const font = await readFile(join(process.cwd(), "public/fonts/Geist-Regular.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "linear-gradient(135deg, #0f3d3e 0%, #125c53 45%, #1a7a6b 100%)",
          color: "#ffffff",
          fontFamily: "Geist",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ornamen sudut */}
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            width: 260,
            height: 260,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.14)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 68,
            right: 68,
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.10)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
              display: "flex",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: title.length > 30 ? 74 : 88,
              lineHeight: 1.08,
              fontWeight: 700,
              maxWidth: 980,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dateLabel ? (
              <div style={{ fontSize: 34, color: "rgba(255,255,255,0.92)", display: "flex" }}>
                {dateLabel}
              </div>
            ) : null}
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", display: "flex" }}>
              Undangan digital interaktif — RSVP, galeri, dan peta acara
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 28px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.25)",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            UndanganE
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Geist", data: font, weight: 400 as const, style: "normal" }],
    },
  );
}
