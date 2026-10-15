import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, Check, Layers, Palette, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/core/config";
import { db, schema } from "@/db";
import {
  InvitationRenderer,
  getTemplate,
  resolveTheme,
  SECTION_ORDER,
  TEMPLATE_REGISTRY,
  type SectionLabels,
} from "@/modules/invitation";

type Params = { params: Promise<{ slug: string }> };

/** Detail template = demo publik; label section diambil dari DB (admin bisa mengedit). */
export const instant = false;

export function generateStaticParams() {
  return Object.keys(TEMPLATE_REGISTRY).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) return { title: "Template tidak ditemukan" };

  const title = `Template ${template.name} - ${template.category} | UndanganE`;
  const description = `${template.description} Coba pratinjau langsung undangan ${template.name}.`;
  const url = `${env.APP_URL}/template/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "UndanganE",
      images: [{ url: template.previewImage, width: 1200, height: 630, alt: template.name }],
      type: "website",
    },
  };
}

const FEATURE_BADGES = [
  { icon: Smartphone, label: "SSR cepat & ramah SEO" },
  { icon: Palette, label: "Palet & font mudah diubah" },
  { icon: Layers, label: "Section lengkap sesuai kebutuhan" },
  { icon: Check, label: "Optimasi gambar otomatis" },
];

export default async function TemplateDetailPage({ params }: Params) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  const config = template.demo;
  const theme = resolveTheme(template.defaultTheme, config.theme);
  const sections = { ...template.defaultSections, ...config.sections };
  const cover = { ...template.defaultCover, ...config.cover };
  const visibleCount = SECTION_ORDER.filter((id) => sections[id] !== false).length;

  const [row] = await db
    .select({ sectionLabels: schema.templates.sectionLabels })
    .from(schema.templates)
    .where(eq(schema.templates.slug, slug))
    .limit(1);
  const labels = (row?.sectionLabels ?? {}) as SectionLabels;

  return (
    <div className="bg-background min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/template" className="text-sm font-semibold hover:opacity-70">
            ← Semua Template
          </Link>
          <Button render={<Link href="/daftar" />} nativeButton={false} size="sm">
            Gunakan Template Ini
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.24em] uppercase">
              {template.category} · {template.layout.replace("_", " ")}
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{template.name}</h1>
            <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">{template.description}</p>

            <ul className="mt-6 flex flex-wrap gap-2">
              <li className="rounded-full border px-3 py-1 text-xs font-medium">{template.signature}</li>
              <li className="rounded-full border px-3 py-1 text-xs font-medium">{visibleCount} section aktif</li>
            </ul>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {FEATURE_BADGES.map((badge) => (
                <li
                  key={badge.label}
                  className="flex items-center gap-3 rounded-xl border bg-white p-3 text-sm"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal">
                    <badge.icon className="size-4" aria-hidden />
                  </span>
                  {badge.label}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/daftar" />} nativeButton={false}>
                Buat Undangan Ini
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Button render={<Link href="/harga" />} nativeButton={false} variant="outline">
                Lihat Harga
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border">
            <Image
              src={template.previewImage}
              alt={`Pratinjau template ${template.name}`}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Pratinjau langsung</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tampilan nyata di perangkat tamu — gulir untuk melihat seluruh section.
            </p>
          </div>
          <span className="text-muted-foreground hidden text-xs font-semibold uppercase sm:block">
            mode pratinjau
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border shadow-sm">
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
      </section>
    </div>
  );
}
