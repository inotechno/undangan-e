"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Gift, Loader2 } from "lucide-react";

type Row = {
  id: string;
  slug: string;
  status: string;
  seoTitle: string | null;
  coupleLabel: string | null;
  giftEnabled: boolean;
  giftAccounts: number;
};

function titleOf(r: Row) {
  return r.seoTitle ?? r.coupleLabel ?? r.slug;
}

export function GiftClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function toggleGift(r: Row) {
    setBusyId(r.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/invitations/${r.id}`);
      if (!res.ok) return;
      const inv = (await res.json()) as { config: Record<string, unknown> };
      const config = { ...inv.config, gift: { ...(inv.config.gift as Record<string, unknown>), enabled: !r.giftEnabled } };
      const patch = await fetch(`/api/invitations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!patch.ok) {
        const data = (await patch.json().catch(() => ({}))) as { error?: string };
        setMsg({ tone: "err", text: data.error ?? "Gagal memperbarui gift" });
        return;
      }
      setItems((d) => d.map((x) => (x.id === r.id ? { ...x, giftEnabled: !x.giftEnabled } : x)));
      setMsg({
        tone: "ok",
        text: `Gift ${!r.giftEnabled ? "diaktifkan" : "dinonaktifkan"} untuk "${titleOf(r)}"`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#e4ebee] bg-white p-10 text-center">
        <Gift className="mx-auto size-8 text-[#cbd5db]" aria-hidden />
        <p className="mt-3 text-xs font-bold text-[#425968]">Belum ada undangan</p>
        <p className="mt-1 text-[11px] text-[#687b88]">Buat undangan dulu untuk mengatur gift digital.</p>
        <Link
          href="/dashboard/baru"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-teal px-4 text-[11px] font-bold text-white hover:bg-teal-dark"
        >
          Buat Undangan
        </Link>
      </div>
    );
  }

  return (
    <div>
      {msg ? (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-[11px] font-semibold ${
            msg.tone === "ok" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#fff0f2] text-[#be123c]"
          }`}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}
      <ul className="space-y-2">
        {items.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#142c3c]">{titleOf(r)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    r.status === "active" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#f1f5f7] text-[#687b88]"
                  }`}
                >
                  {r.status === "active" ? "Aktif" : r.status === "draft" ? "Draft" : r.status}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#687b88]">
                {r.giftEnabled ? (
                  <>
                    Gift <span className="font-bold text-teal">aktif</span> — {r.giftAccounts} rekening terdaftar
                  </>
                ) : (
                  <>Gift nonaktif</>
                )}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={r.giftEnabled}
                disabled={busyId === r.id}
                onChange={() => toggleGift(r)}
                className="size-4 accent-teal"
              />
              <span className="text-[11px] font-bold text-[#425968]">Tampilkan di undangan</span>
              {busyId === r.id ? <Loader2 className="size-3.5 animate-spin text-teal" aria-hidden /> : null}
            </label>
            <Link
              href={`/undangan/${r.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#dbe5e9] bg-white px-3 text-[11px] font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal"
            >
              Edit Rekening
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
