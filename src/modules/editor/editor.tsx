"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Link as LinkIcon,
  Loader2,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type InvitationConfig } from "@/modules/invitation";
import type { SectionId, SectionLabels, ThemeTokens } from "@/modules/invitation";
import { slugSchema } from "@/modules/invitations/slug";
import { STATUS_CLASS, STATUS_LABEL } from "@/modules/invitations/status";
import { useAutosave } from "./use-autosave";
import { PhonePreview } from "./preview";
import {
  AcaraPanel,
  HadiahMusikPanel,
  JadwalPanel,
  KontenPanel,
  DesainPanel,
  SeoPanel,
} from "./panels";

export interface EditorInitial {
  id: string;
  slug: string;
  status: string;
  config: InvitationConfig;
  pendingOrderId: string | null;
  template: {
    name: string;
    layout: "full_bleed" | "curtain" | "frame_device" | "slider";
    defaultTheme?: Partial<ThemeTokens>;
    defaultSections?: Partial<Record<SectionId, boolean>>;
    sectionLabels?: SectionLabels;
  };
}

const TABS = [
  { id: "acara", label: "Acara" },
  { id: "jadwal", label: "Jadwal" },
  { id: "konten", label: "Konten" },
  { id: "hadiah", label: "Hadiah & Musik" },
  { id: "desain", label: "Desain" },
  { id: "seo", label: "SEO & Tautan" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SAVE_LABEL = {
  idle: "Tersinkron",
  saving: "Menyimpan…",
  saved: "Tersimpan",
  error: "Gagal menyimpan",
} as const;

export function InvitationEditor({ initial }: { initial: EditorInitial }) {
  const router = useRouter();
  const [config, setConfig] = useState<InvitationConfig>(initial.config);
  const [status, setStatus] = useState(initial.status);
  const [slug, setSlug] = useState(initial.slug);
  const [slugDraft, setSlugDraft] = useState(initial.slug);
  const [slugMsg, setSlugMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [tab, setTab] = useState<TabId>("acara");

  const { state, error, saveNow } = useAutosave(initial.id, config);

  function mutate(fn: (draft: InvitationConfig) => void) {
    setConfig((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }

  const title =
    config.seo.title ??
    (config.event.couple
      ? `${config.event.couple.brideName} & ${config.event.couple.groomName}`
      : (config.event.celebrant?.name ?? config.event.host?.name ?? "Undangan"));

  async function updateSlug() {
    const parsed = slugSchema.safeParse(slugDraft.trim());
    if (!parsed.success) {
      setSlugMsg({ tone: "err", text: parsed.error.issues[0]?.message ?? "Slug tidak valid" });
      return;
    }
    if (parsed.data === slug) {
      setSlugMsg(null);
      return;
    }
    setSlugMsg(null);
    const ok = await saveNow({ slug: parsed.data });
    if (ok) {
      setSlug(parsed.data);
      setSlugMsg({ tone: "ok", text: "Slug diperbarui" });
    } else {
      setSlugMsg({ tone: "err", text: error ?? "Gagal memperbarui slug" });
    }
  }

  async function togglePublish() {
    setLifecycleBusy(true);
    try {
      if (status === "active") {
        const res = await fetch(`/api/invitations/${initial.id}/unpublish`, { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setSlugMsg({ tone: "err", text: data.error ?? "Gagal mengubah status" });
          return;
        }
        setStatus("draft");
        return;
      }
      // Bayar & Terbitkan: flush autosave → buat order → halaman bayar QRIS.
      await saveNow({ config });
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: initial.id,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { orderId?: string; error?: string };
      if (!res.ok || !data.orderId) {
        setSlugMsg({ tone: "err", text: data.error ?? "Gagal membuat pesanan" });
        return;
      }
      router.push(`/bayar/${data.orderId}`);
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Hapus undangan ini? Tindakan tidak bisa dibatalkan.")) return;
    const res = await fetch(`/api/invitations/${initial.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="text-muted-warm text-sm hover:text-charcoal">
          <ArrowLeft className="mr-1 inline size-4" aria-hidden />
          Undangan Saya
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              state === "saving" && "text-muted-warm",
              state === "saved" && "text-teal",
              state === "error" && "text-red-600",
            )}
            aria-live="polite"
          >
            {state === "saving" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : state === "saved" ? (
              <CheckCircle2 className="size-3.5" aria-hidden />
            ) : state === "error" ? (
              <TriangleAlert className="size-3.5" aria-hidden />
            ) : null}
            {SAVE_LABEL[state]}
          </span>
          <Badge variant="outline" className={cn("text-[11px] font-semibold", STATUS_CLASS[status])}>
            {STATUS_LABEL[status] ?? status}
          </Badge>
          {status === "active" ? (
            <Button render={<Link href={`/i/${slug}`} />} nativeButton={false} size="sm" variant="outline">
              <Eye className="size-3.5" aria-hidden />
              Lihat undangan
            </Button>
          ) : null}
          {status === "active" ? (
            <Button size="sm" onClick={() => void togglePublish()} disabled={lifecycleBusy}>
              {lifecycleBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              Tarik
            </Button>
          ) : initial.pendingOrderId ? (
            <Button
              render={<Link href={`/bayar/${initial.pendingOrderId}`} />}
              nativeButton={false}
              size="sm"
            >
              <Upload className="size-4" aria-hidden />
              Bayar Sekarang
            </Button>
          ) : (
            <Button size="sm" onClick={() => void togglePublish()} disabled={lifecycleBusy}>
              {lifecycleBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              Bayar & Terbitkan
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => void remove()}>
            <Trash2 className="size-4" aria-hidden />
            Hapus
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-warm mt-0.5 text-xs">
            Template {initial.template.name} · perubahan tersimpan otomatis
          </p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1 rounded-xl border border-border-warm bg-surface p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-teal-soft text-teal" : "text-muted-warm hover:text-charcoal",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-border-warm bg-surface p-4 sm:p-5">
            {tab === "acara" ? <AcaraPanel invitationId={initial.id} config={config} mutate={mutate} /> : null}
            {tab === "jadwal" ? <JadwalPanel invitationId={initial.id} config={config} mutate={mutate} /> : null}
            {tab === "konten" ? <KontenPanel invitationId={initial.id} config={config} mutate={mutate} /> : null}
            {tab === "hadiah" ? <HadiahMusikPanel invitationId={initial.id} config={config} mutate={mutate} /> : null}
            {tab === "desain" ? <DesainPanel invitationId={initial.id} config={config} mutate={mutate} /> : null}
            {tab === "seo" ? (
              <div className="space-y-6">
                <SeoPanel invitationId={initial.id} config={config} mutate={mutate} />

                <section className="space-y-3 rounded-xl border border-border-warm p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <LinkIcon className="size-4 text-teal" aria-hidden />
                    Alamat undangan
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={slugDraft}
                      onChange={(e) => setSlugDraft(e.target.value.toLowerCase())}
                      className="h-9 max-w-xs font-mono text-xs"
                      aria-label="Slug undangan"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => void updateSlug()}>
                      Perbarui slug
                    </Button>
                  </div>
                  {slugMsg ? (
                    <p className={cn("text-xs", slugMsg.tone === "ok" ? "text-teal" : "text-red-600")}>
                      {slugMsg.text}
                    </p>
                  ) : null}
                  <p className="text-muted-warm text-[11px]">
                    {status === "active"
                      ? `Tautan publik: /i/${slug}`
                      : "Tautan aktif setelah undangan diterbitkan."}
                  </p>
                </section>
              </div>
            ) : null}
          </div>

          {state === "error" && error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 lg:hidden">
            <p className="text-muted-warm mb-2 text-xs font-semibold tracking-wider uppercase">
              Pratinjau tampilan tamu
            </p>
            <PhonePreview
              config={config}
              layout={initial.template.layout}
              defaultTheme={initial.template.defaultTheme}
              defaultSections={initial.template.defaultSections}
              labels={initial.template.sectionLabels}
            />
          </div>
        </div>

        <aside className="sticky top-20 hidden lg:block">
          <p className="text-muted-warm mb-2 text-xs font-semibold tracking-wider uppercase">
            Pratinjau langsung
          </p>
          <PhonePreview
            config={config}
            layout={initial.template.layout}
            defaultTheme={initial.template.defaultTheme}
            defaultSections={initial.template.defaultSections}
            labels={initial.template.sectionLabels}
          />
        </aside>
      </div>
    </div>
  );
}
