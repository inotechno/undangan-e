import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  InvitationRenderer,
  getTemplate,
  resolveTheme,
  TEMPLATE_REGISTRY,
  type SectionLabels,
} from "@/modules/invitation";

type Params = { params: Promise<{ slug: string }> };

/** Screenshot thumbnail dijalankan dari script — selalu dinamis (label dari DB). */
export const instant = false;

export const metadata: Metadata = {
  title: "Shot Template",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return Object.keys(TEMPLATE_REGISTRY).map((slug) => ({ slug }));
}

export default async function TemplateShotPage({ params }: Params) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  const [row] = await db
    .select({ sectionLabels: schema.templates.sectionLabels })
    .from(schema.templates)
    .where(eq(schema.templates.slug, slug))
    .limit(1);

  const config = template.demo;
  const theme = resolveTheme(template.defaultTheme, config.theme);
  const sections = { ...template.defaultSections, ...config.sections };
  const cover = { ...template.defaultCover, ...config.cover };
  const labels = (row?.sectionLabels ?? {}) as SectionLabels;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0f1418]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${theme.palette.accentSoft} 0%, ${theme.palette.bg} 45%, #dfe7e6 100%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.55) 0, transparent 40%), radial-gradient(circle at 80% 75%, rgba(0,0,0,0.06) 0, transparent 45%)",
        }}
      />

      {/* Mockup HP — tinggi 1100px, layar menampung cover penuh */}
      <div
        className="relative z-10 shrink-0 overflow-hidden rounded-[44px] shadow-[0_30px_80px_rgba(10,25,35,0.45)]"
        style={{ width: 512, height: 1100 }}
      >
        <div className="absolute inset-0 overflow-hidden" style={{ transform: "translateZ(0)" }}>
          <InvitationRenderer
            config={{ ...config, cover }}
            theme={theme}
            layout={template.layout}
            sections={sections}
            guest={null}
            wishes={[]}
            mode="preview"
            labels={labels}
          />
        </div>
        {/* Bezel & dynamic island */}
        <div className="pointer-events-none absolute inset-0 rounded-[44px] border-[9px] border-[#101317]" />
        <div className="pointer-events-none absolute top-4 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-[#101317]" />
      </div>
    </div>
  );
}
