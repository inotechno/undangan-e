import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, X } from "lucide-react";
import { db, schema } from "@/db";
import {
  InvitationRenderer,
  getTemplate,
  resolveTheme,
  TEMPLATE_REGISTRY,
  type SectionLabels,
} from "@/modules/invitation";

type Params = { params: Promise<{ slug: string }> };

/** Demo POV tamu — label section diambil dari DB agar sama dengan produksi. */
export const instant = false;

export const metadata: Metadata = {
  title: "Demo Undangan",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return Object.keys(TEMPLATE_REGISTRY).map((slug) => ({ slug }));
}

export default async function TemplateLiveDemoPage({ params }: Params) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  const config = template.demo;
  const theme = resolveTheme(template.defaultTheme, config.theme);
  const sections = { ...template.defaultSections, ...config.sections };
  const cover = { ...template.defaultCover, ...config.cover };

  const [row] = await db
    .select({ sectionLabels: schema.templates.sectionLabels })
    .from(schema.templates)
    .where(eq(schema.templates.slug, slug))
    .limit(1);
  const labels = (row?.sectionLabels ?? {}) as SectionLabels;

  return (
    <div className="relative min-h-dvh">
      {/* Toolbar minim — POV tamu tetap utuh di belakangnya */}
      <div className="fixed top-3 right-3 left-3 z-50 flex items-center justify-between gap-2 sm:left-auto">
        <Link
          href={`/template/${slug}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 text-[11px] font-bold text-charcoal shadow-md backdrop-blur-sm transition-colors hover:bg-white"
        >
          <X className="size-3.5" aria-hidden />
          Tutup Demo
        </Link>
        <Link
          href="/daftar"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-teal px-3.5 text-[11px] font-bold text-white shadow-md transition-colors hover:bg-teal-hover"
        >
          Gunakan Template Ini
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <InvitationRenderer
        config={{ ...config, cover }}
        theme={theme}
        layout={template.layout}
        sections={sections}
        guest={null}
        wishes={[]}
        mode="live"
        labels={labels}
      />
    </div>
  );
}
