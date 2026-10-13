"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Pagination, paginate } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import type { GuestRow, GuestStats } from "@/modules/guests/server";
import type { WishRow } from "@/modules/guests/wishes";

const PER_PAGE_GUEST = 25;
const PER_PAGE_WISH = 10;

const SOURCE_LABEL: Record<string, string> = {
  import: "Impor",
  manual: "Manual",
  link: "Tautan",
  form: "Formulir",
};

const RSVP_META: Record<string, { label: string; className: string }> = {
  attending: { label: "Hadir", className: "bg-[#e9f8ef] text-[#15803d]" },
  declined: { label: "Tidak hadir", className: "bg-[#fff0f2] text-[#be123c]" },
  pending: { label: "Menunggu", className: "bg-[#fff7df] text-[#a16207]" },
};

function RsvpBadge({ rsvp }: { rsvp: string }) {
  const meta = RSVP_META[rsvp] ?? RSVP_META.pending!;
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-[3px] text-[10px] font-bold", meta.className)}>
      {meta.label}
    </span>
  );
}

async function api(path: string, init?: RequestInit): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(path, init);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: res.ok, error: data.error };
  } catch {
    return { ok: false, error: "Koneksi bermasalah" };
  }
}

/* ── Form tambah tamu ────────────────────────────────────── */

function AddGuestForm({ invitationId, onDone }: { invitationId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", groupName: "", quota: "1" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api(`/api/invitations/${invitationId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone || null,
        groupName: form.groupName || null,
        quota: Number(form.quota) || 1,
      }),
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Gagal menambah tamu");
      return;
    }
    setForm({ name: "", phone: "", groupName: "", quota: "1" });
    setOpen(false);
    onDone();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-teal px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
      >
        <Plus className="size-3.5" aria-hidden />
        Tambah Tamu
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-charcoal">Tambah Tamu Baru</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-muted-warm hover:bg-[#f2f8f8]">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">Nama *</span>
          <input
            required
            minLength={2}
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 h-9 w-full rounded-lg border border-border-warm bg-white px-3 text-xs text-charcoal outline-none focus-visible:border-teal"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">No. HP</span>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 h-9 w-full rounded-lg border border-border-warm bg-white px-3 text-xs text-charcoal outline-none focus-visible:border-teal"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">Grup</span>
          <input
            value={form.groupName}
            onChange={(e) => setForm({ ...form, groupName: e.target.value })}
            placeholder="Keluarga, Teman kantor, …"
            className="mt-1 h-9 w-full rounded-lg border border-border-warm bg-white px-3 text-xs text-charcoal outline-none focus-visible:border-teal"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">Kuota</span>
          <input
            type="number"
            min={1}
            max={50}
            value={form.quota}
            onChange={(e) => setForm({ ...form, quota: e.target.value })}
            className="mt-1 h-9 w-full rounded-lg border border-border-warm bg-white px-3 text-xs text-charcoal outline-none focus-visible:border-teal"
          />
        </label>
      </div>
      {error ? <p className="mt-2 text-[11px] text-rose-600">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-teal px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
          Simpan
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-9 items-center rounded-[10px] border border-[#d8e3e8] bg-white px-3.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

/* ── Impor CSV ───────────────────────────────────────────── */

function ImportCsv({ invitationId, onDone }: { invitationId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/guests/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        imported?: number;
        skipped?: number;
        failures?: { line: number; reason: string }[];
        error?: string;
      };
      if (!res.ok) {
        setResult(data.error ?? "Impor gagal");
        return;
      }
      setResult(
        `Berhasil impor ${data.imported ?? 0}, dilewati ${data.skipped ?? 0}${data.failures?.length ? `, gagal ${data.failures.length}` : ""}.`,
      );
      onDone();
    } catch {
      setResult("Koneksi bermasalah");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#d8e3e8] bg-white px-3.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
      >
        <Upload className="size-3.5" aria-hidden />
        Impor CSV
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-bold text-charcoal">Impor Tamu (CSV)</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-muted-warm hover:bg-[#f2f8f8]">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mb-2 text-[11px] text-muted-warm">
        Satu tamu per baris: <code className="rounded bg-[#f3f6f8] px-1">nama,no_hp,grup,kuota</code>. Header opsional, maksimal 1000 baris.
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder={"nama,no_hp,grup,kuota\nBudi Santoso,0812xxxx,Keluarga,2\nSiti Aminah,0813xxxx,Teman,1"}
        className="w-full rounded-lg border border-border-warm bg-white px-3 py-2 font-mono text-[11px] text-charcoal outline-none focus-visible:border-teal"
      />
      {result ? <p className="mt-2 text-[11px] text-charcoal">{result}</p> : null}
      <button
        type="submit"
        disabled={busy || !csv.trim()}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-teal px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
        Impor
      </button>
    </form>
  );
}

/* ── Edit tamu ───────────────────────────────────────────── */

function EditGuestRow({
  invitationId,
  guest,
  onDone,
  onCancel,
}: {
  invitationId: string;
  guest: GuestRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: guest.name,
    phone: guest.phone ?? "",
    groupName: guest.groupName ?? "",
    quota: String(guest.quota),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api(`/api/invitations/${invitationId}/guests/${guest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone || null,
        groupName: form.groupName || null,
        quota: Number(form.quota) || 1,
      }),
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Gagal menyimpan");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-teal/40 bg-[#f2fafa] p-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <input
          required
          minLength={2}
          maxLength={60}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          aria-label="Nama"
          className="h-8 rounded-lg border border-border-warm bg-white px-2.5 text-[11px] text-charcoal outline-none focus-visible:border-teal"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          aria-label="No. HP"
          className="h-8 rounded-lg border border-border-warm bg-white px-2.5 text-[11px] text-charcoal outline-none focus-visible:border-teal"
        />
        <input
          value={form.groupName}
          onChange={(e) => setForm({ ...form, groupName: e.target.value })}
          aria-label="Grup"
          className="h-8 rounded-lg border border-border-warm bg-white px-2.5 text-[11px] text-charcoal outline-none focus-visible:border-teal"
        />
        <input
          type="number"
          min={1}
          max={50}
          value={form.quota}
          onChange={(e) => setForm({ ...form, quota: e.target.value })}
          aria-label="Kuota"
          className="h-8 rounded-lg border border-border-warm bg-white px-2.5 text-[11px] text-charcoal outline-none focus-visible:border-teal"
        />
      </div>
      {error ? <p className="mt-1.5 text-[11px] text-rose-600">{error}</p> : null}
      <div className="mt-2 flex gap-1.5">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-teal px-3 text-[11px] font-bold text-white hover:bg-teal-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3 animate-spin" aria-hidden /> : <Check className="size-3" aria-hidden />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-lg border border-[#d8e3e8] bg-white px-3 text-[11px] font-bold text-charcoal hover:border-teal hover:text-teal"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

/* ── Manager utama ───────────────────────────────────────── */

export function GuestManager({
  invitationId,
  slug,
  isActive,
  appUrl,
  initialItems,
  initialStats,
  initialWishes,
  wishVisible,
  wishHidden,
}: {
  invitationId: string;
  slug: string;
  isActive: boolean;
  appUrl: string;
  initialItems: GuestRow[];
  initialStats: GuestStats;
  initialWishes: WishRow[];
  wishVisible: number;
  wishHidden: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"tamu" | "ucapan">("tamu");
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [wishes, setWishes] = useState<WishRow[]>(initialWishes);
  const [wishStats, setWishStats] = useState({ visible: wishVisible, hidden: wishHidden });
  const [guestPage, setGuestPage] = useState(1);
  const [wishPage, setWishPage] = useState(1);

  const refresh = () => router.refresh();

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return initialItems.filter((g) => {
      if (needle && !g.name.toLowerCase().includes(needle) && !(g.groupName ?? "").toLowerCase().includes(needle)) return false;
      if (source && g.source !== source) return false;
      if (rsvpFilter && g.rsvp !== rsvpFilter) return false;
      return true;
    });
  }, [initialItems, q, source, rsvpFilter]);

  const guestTotalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE_GUEST));
  const guestSafePage = Math.min(guestPage, guestTotalPages);
  const guestPageItems = paginate(visible, guestSafePage, PER_PAGE_GUEST);

  const wishTotalPages = Math.max(1, Math.ceil(wishes.length / PER_PAGE_WISH));
  const wishSafePage = Math.min(wishPage, wishTotalPages);
  const wishPageItems = paginate(wishes, wishSafePage, PER_PAGE_WISH);

  function personalUrl(g: GuestRow) {
    return `${appUrl}/i/${slug}?g=${g.guestCode}`;
  }

  async function copyLink(g: GuestRow) {
    try {
      await navigator.clipboard.writeText(personalUrl(g));
      setCopied(g.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  async function setRsvp(g: GuestRow, status: "attending" | "declined" | "pending") {
    await api(`/api/invitations/${invitationId}/guests/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvp: status }),
    });
    refresh();
  }

  async function removeGuest(g: GuestRow) {
    if (!window.confirm(`Hapus tamu "${g.name}"? Tautan personalnya ikut nonaktif.`)) return;
    await api(`/api/invitations/${invitationId}/guests/${g.id}`, { method: "DELETE" });
    refresh();
  }

  async function moderate(wish: WishRow, status: "visible" | "hidden") {
    const r = await api(`/api/invitations/${invitationId}/guestbook/${wish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setWishes((ws) => ws.map((w) => (w.id === wish.id ? { ...w, status } : w)));
      setWishStats((s) => ({
        visible: s.visible + (status === "visible" ? 1 : -1),
        hidden: s.hidden + (status === "hidden" ? 1 : -1),
      }));
    }
  }

  async function removeWish(wish: WishRow) {
    if (!window.confirm("Hapus ucapan ini permanen?")) return;
    const r = await api(`/api/invitations/${invitationId}/guestbook/${wish.id}`, { method: "DELETE" });
    if (r.ok) {
      setWishes((ws) => ws.filter((w) => w.id !== wish.id));
      setWishStats((s) => ({
        visible: Math.max(0, s.visible - (wish.status === "visible" ? 1 : 0)),
        hidden: Math.max(0, s.hidden - (wish.status === "hidden" ? 1 : 0)),
      }));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-0.7px] text-charcoal">Kelola Tamu</h1>
          <p className="mt-1.5 text-xs text-muted-warm">
            Undangan <span className="font-semibold text-teal-dark">/{slug}</span>
            {!isActive ? " (belum dipublikasikan — QR & RSVP aktif setelah publish)" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddGuestForm invitationId={invitationId} onDone={refresh} />
          <ImportCsv invitationId={invitationId} onDone={refresh} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Total Tamu", value: initialStats.total },
          { label: "Hadir", value: initialStats.attending },
          { label: "Tidak Hadir", value: initialStats.declined },
          { label: "Menunggu", value: initialStats.pending },
          { label: "Check-in", value: initialStats.checkedIn },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)]"
          >
            <div className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">{s.label}</div>
            <div className="mt-1.5 text-[24px] font-extrabold tracking-[-0.6px] text-charcoal">
              {s.value.toLocaleString("id-ID")}
            </div>
          </article>
        ))}
      </div>

      <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Bagian kelola tamu">
        {([
          { key: "tamu", label: `Daftar Tamu (${initialStats.total})`, icon: Users },
          { key: "ucapan", label: `Buku Tamu (${wishStats.visible + wishStats.hidden})`, icon: MessageSquare },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-colors",
              tab === t.key
                ? "bg-teal text-white"
                : "border border-transparent bg-[#f3f6f8] text-[#657587] hover:text-charcoal",
            )}
          >
            <t.icon className="size-3.5" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tamu" ? (
        <section className="rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#8a99a6]" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setGuestPage(1);
                }}
                placeholder="Cari nama atau grup..."
                aria-label="Cari tamu"
                className="h-9 w-full rounded-lg border border-border-warm bg-white pr-2 pl-8 text-xs text-charcoal outline-none focus-visible:border-teal"
              />
            </div>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setGuestPage(1);
              }}
              aria-label="Filter sumber"
              className="h-9 rounded-lg border border-border-warm bg-white px-2.5 text-xs text-charcoal outline-none focus-visible:border-teal"
            >
              <option value="">Semua sumber</option>
              <option value="manual">Manual</option>
              <option value="import">Impor</option>
              <option value="link">Tautan</option>
              <option value="form">Formulir</option>
            </select>
            <select
              value={rsvpFilter}
              onChange={(e) => {
                setRsvpFilter(e.target.value);
                setGuestPage(1);
              }}
              aria-label="Filter RSVP"
              className="h-9 rounded-lg border border-border-warm bg-white px-2.5 text-xs text-charcoal outline-none focus-visible:border-teal"
            >
              <option value="">Semua RSVP</option>
              <option value="attending">Hadir</option>
              <option value="declined">Tidak hadir</option>
              <option value="pending">Menunggu</option>
            </select>
            {initialStats.total > 0 ? (
              <a
                href={`/api/invitations/${invitationId}/guests/qr-bulk`}
                download
                aria-label="Unduh massal tiket QR semua tamu"
                title="Unduh ZIP berisi tiket QR (PNG) semua tamu"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-warm bg-white px-3 text-[11px] font-bold text-charcoal transition-colors hover:text-teal"
              >
                <Download className="size-3.5" aria-hidden />
                Unduh QR Massal
              </a>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-warm">
                {initialItems.length === 0
                  ? "Belum ada tamu. Tambah manual atau impor CSV."
                  : "Tamu tidak ditemukan."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf1f3]">
                    {["Nama", "Grup", "Kuota", "Sumber", "RSVP", "Tautan personal", ""].map((h) => (
                      <th key={h} className="px-2 py-2.5 text-[10px] font-bold tracking-wide text-muted-warm uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guestPageItems.map((g) =>
                    editing === g.id ? (
                      <tr key={g.id}>
                        <td colSpan={7} className="px-2 py-2">
                          <EditGuestRow
                            invitationId={invitationId}
                            guest={g}
                            onDone={() => {
                              setEditing(null);
                              refresh();
                            }}
                            onCancel={() => setEditing(null)}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={g.id} className="border-b border-[#f3f6f8] last:border-0">
                        <td className="px-2 py-2.5">
                          <p className="text-xs font-bold text-charcoal">{g.name}</p>
                          {g.phone ? <p className="mt-0.5 text-[10px] text-muted-warm">{g.phone}</p> : null}
                        </td>
                        <td className="px-2 py-2.5 text-[11px] text-[#536477]">{g.groupName || "—"}</td>
                        <td className="px-2 py-2.5 text-[11px] text-[#536477]">{g.quota}</td>
                        <td className="px-2 py-2.5">
                          <span className="inline-flex rounded-full bg-[#f3f6f8] px-2.5 py-[3px] text-[10px] font-semibold text-[#657587]">
                            {SOURCE_LABEL[g.source] ?? g.source}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            type="button"
                            onClick={() => void setRsvp(g, g.rsvp === "attending" ? "pending" : "attending")}
                            title="Klik untuk ubah RSVP"
                          >
                            <RsvpBadge rsvp={g.rsvp} />
                          </button>
                        </td>
                        <td className="px-2 py-2.5">
                          {isActive ? (
                            <div className="flex items-center gap-1">
                              <code className="max-w-[180px] truncate rounded bg-[#f3f6f8] px-1.5 py-1 text-[10px] text-[#536477]">
                                ?g={g.guestCode}
                              </code>
                              <button
                                type="button"
                                onClick={() => void copyLink(g)}
                                aria-label={`Salin tautan ${g.name}`}
                                title="Salin tautan"
                                className="rounded-lg p-1.5 text-muted-warm transition-colors hover:bg-[#f2f8f8] hover:text-teal"
                              >
                                {copied === g.id ? <Check className="size-3.5 text-emerald-600" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                              </button>
                              <a
                                href={`/api/invitations/${invitationId}/guests/${g.id}/qr`}
                                download={`tiket-${g.guestCode}.png`}
                                aria-label={`Unduh tiket QR ${g.name}`}
                                title="Unduh tiket QR (PNG)"
                                className="rounded-lg p-1.5 text-muted-warm transition-colors hover:bg-[#f2f8f8] hover:text-teal"
                              >
                                <Download className="size-3.5" aria-hidden />
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-warm">Aktif setelah publish</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditing(g.id)}
                              aria-label={`Edit ${g.name}`}
                              title="Edit"
                              className="rounded-lg p-1.5 text-muted-warm transition-colors hover:bg-[#f2f8f8] hover:text-teal"
                            >
                              <Pencil className="size-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeGuest(g)}
                              aria-label={`Hapus ${g.name}`}
                              title="Hapus"
                              className="rounded-lg p-1.5 text-muted-warm transition-colors hover:bg-[#fff0f2] hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

          {visible.length > 0 ? (
            <p className="mt-3 text-center text-[10px] text-muted-warm">
              Menampilkan {guestPageItems.length} dari {visible.length} tamu
            </p>
          ) : null}
          <Pagination page={guestSafePage} totalPages={guestTotalPages} onPageChange={setGuestPage} label="Navigasi halaman tamu" />
        </section>
      ) : (
        <section className="rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
          <p className="mb-3 text-[11px] text-muted-warm">
            {wishStats.visible} tampil · {wishStats.hidden} disembunyikan · Sembunyikan ucapan agar tidak tampil di undangan.
          </p>
          {wishes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-warm">Belum ada ucapan masuk.</p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {wishPageItems.map((w) => (
                <article
                  key={w.id}
                  className={cn(
                    "rounded-[15px] border border-border-warm p-4",
                    w.status === "hidden" && "opacity-60",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-charcoal">{w.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-warm">
                        {new Date(w.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        {w.status === "hidden" ? " · Disembunyikan" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => void moderate(w, w.status === "visible" ? "hidden" : "visible")}
                        title={w.status === "visible" ? "Sembunyikan" : "Tampilkan"}
                        aria-label={w.status === "visible" ? "Sembunyikan ucapan" : "Tampilkan ucapan"}
                        className="rounded-lg p-1.5 text-muted-warm transition-colors hover:bg-[#f2f8f8] hover:text-teal"
                      >
                        {w.status === "visible" ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeWish(w)}
                        title="Hapus permanen"
                        aria-label="Hapus ucapan"
                        className="rounded-lg p-1.5 text-muted-warm transition-colors hover:bg-[#fff0f2] hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#536477]">{w.message}</p>
                </article>
              ))}
            </div>
          )}

          {wishes.length > 0 ? (
            <p className="mt-3 text-center text-[10px] text-muted-warm">
              Menampilkan {wishPageItems.length} dari {wishes.length} ucapan
            </p>
          ) : null}
          <Pagination page={wishSafePage} totalPages={wishTotalPages} onPageChange={setWishPage} label="Navigasi halaman buku tamu" />
        </section>
      )}

      {isActive ? (
        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-warm">
          <Link2 className="size-3.5" aria-hidden />
          Tautan personal: {appUrl}/i/{slug}?g=&lt;kode-tamu&gt; — salin dari kolom tautan.
        </p>
      ) : null}
    </div>
  );
}
