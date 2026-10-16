import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { eq } from "drizzle-orm";

export const alt = "Pratinjau template undangan digital UndanganE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const rows = await db
    .select({ name: templates.name, description: templates.description, preview: templates.previewImageKey })
    .from(templates)
    .where(eq(templates.slug, slug))
    .limit(1);

  const tpl = rows[0];
  const name = tpl?.name ?? "Template Undangan";
  const description = tpl?.description ?? "Template undangan digital siap pakai.";

  // Preview file lokal (public/…). Kalau tidak ada → layout tanpa gambar.
  let preview: ArrayBuffer | null = null;
  const previewAspect = 1500 / 1860;
  if (tpl?.preview?.startsWith("/") && !tpl.preview.startsWith("//")) {
    try {
      const rel = tpl.preview.replace(/^\/+/, "");
      const buf = await readFile(join(process.cwd(), "public", rel));
      preview = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    } catch {
      preview = null;
    }
  }

  const font = await readFile(join(process.cwd(), "public/fonts/Geist-Regular.ttf"));

  const previewH = 470;
  const previewW = Math.round(previewH * previewAspect);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "linear-gradient(135deg, #101820 0%, #17242e 60%, #1d3140 100%)",
          color: "#ffffff",
          fontFamily: "Geist",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 24px 64px 72px",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: "#7fd6c5",
              display: "flex",
            }}
          >
            Template Undangan
          </div>
          <div
            style={{
              fontSize: name.length > 24 ? 64 : 76,
              lineHeight: 1.1,
              fontWeight: 700,
              maxWidth: 560,
              display: "flex",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.78)",
              maxWidth: 540,
              display: "flex",
            }}
          >
            {description.slice(0, 140)}
          </div>
          <div
            style={{
              marginTop: 8,
              alignSelf: "flex-start",
              padding: "13px 30px",
              borderRadius: 999,
              background: "#0d9488",
              fontSize: 26,
              fontWeight: 600,
              display: "flex",
            }}
          >
            Coba di UndanganE
          </div>
        </div>

        <div
          style={{
            width: previewW + 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 72,
          }}
        >
          {preview ? (
            <div
              style={{
                display: "flex",
                borderRadius: 26,
                overflow: "hidden",
                border: "4px solid rgba(255,255,255,0.35)",
                boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview as unknown as string} alt={name} width={previewW} height={previewH} style={{ display: "flex" }} />
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Geist", data: font, weight: 400 as const, style: "normal" }] },
  );
}
