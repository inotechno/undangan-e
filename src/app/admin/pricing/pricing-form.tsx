"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatIdr, parseIdr } from "@/core/money";

type Props = {
  accountType: "user" | "reseller";
  currentAmount: number;
  label: string;
};

export function PricingForm({ accountType, currentAmount, label }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(formatIdr(currentAmount).replace(/\s/g, ""));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const amountIdr = parseIdr(value);
      if (!Number.isFinite(amountIdr) || amountIdr < 1000) {
        setMsg({ tone: "err", text: "Minimal Rp1.000" });
        return;
      }
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType, amountIdr }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ tone: "err", text: data.error ?? "Gagal menyimpan harga" });
        return;
      }
      setMsg({ tone: "ok", text: "Harga diperbarui" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const labelCls = "text-[10px] font-bold tracking-wide text-[#687b88] uppercase";

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
    >
      <h2 className="text-[15px] font-bold">{label}</h2>
      <p className="mt-0.5 text-[11px] text-[#687b88]">
        Saat ini <strong className="text-[#142c3c]">{formatIdr(currentAmount)}</strong> / undangan
      </p>
      <div className="mt-4 flex items-end gap-3">
        <label className="flex-1">
          <span className={labelCls}>Harga baru (Rp)</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            required
            className="mt-1 h-9 w-full rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-9 shrink-0 items-center rounded-lg bg-teal px-4 text-[11px] font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {busy ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
      {msg ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-[11px] font-semibold ${
            msg.tone === "ok" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#fff0f2] text-[#be123c]"
          }`}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}
