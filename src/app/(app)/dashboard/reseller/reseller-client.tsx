"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Crown, Loader2, Sparkles } from "lucide-react";

function formatIdr(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

const BENEFITS = [
  "Harga publikasi lebih murah untuk setiap undangan",
  "Kelola undangan pelanggan dari akun Anda",
  "Prioritas dukungan teknis",
  "Akses fitur reseller eksklusif",
];

export function ResellerClient({
  isReseller,
  priceIdr,
  enabled,
}: {
  isReseller: boolean;
  priceIdr: number;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reseller/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      const data = (await res.json().catch(() => ({}))) as { orderId?: string; alreadyPaid?: boolean; error?: string };
      if (!res.ok || !data.orderId) {
        setError(data.error ?? "Gagal membuat order upgrade");
        return;
      }
      router.push(`/bayar/${data.orderId}`);
    } finally {
      setBusy(false);
    }
  }

  if (isReseller) {
    return (
      <div className="rounded-2xl border border-[#d5eeeb] bg-gradient-to-br from-[#eaf8f6] to-[#f7fbfb] p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-[#a16207] shadow-sm">
          <Crown className="size-7" aria-hidden />
        </div>
        <h1 className="mt-4 text-[22px] font-bold tracking-[-0.5px] text-charcoal">Anda sudah Reseller</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-warm">
          Terima kasih telah menjadi bagian dari program reseller UndanganE. Harga khusus sudah aktif
          untuk semua pembelian undangan Anda.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-[10px] bg-teal px-5 text-xs font-bold text-white transition-colors hover:bg-teal-hover"
          >
            Ke Dashboard
          </a>
          <a
            href="/harga"
            className="inline-flex h-10 items-center rounded-[10px] border border-[#dbe5e9] bg-white px-5 text-xs font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal"
          >
            Lihat Harga
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-[#d5eeeb] bg-gradient-to-br from-[#eaf8f6] to-[#f7fbfb] p-6">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-white text-[#a16207] shadow-sm">
            <Crown className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px] text-charcoal">Jadi Reseller UndanganE</h1>
            <p className="text-[11px] text-muted-warm">Sekali bayar — langsung aktif setelah pembayaran.</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs leading-relaxed text-[#425968]">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white bg-white/70 p-4">
          <div>
            <p className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">Biaya upgrade</p>
            <p className="mt-0.5 text-2xl font-extrabold text-charcoal">
              Rp{formatIdr(priceIdr)}
              <span className="ml-1 text-[11px] font-semibold text-muted-warm">sekali bayar</span>
            </p>
          </div>
          <Sparkles className="size-6 text-[#a16207]" aria-hidden />
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-[#fff0f2] px-3 py-2 text-[11px] font-semibold text-[#be123c]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={upgrade}
          disabled={busy || !enabled}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-teal text-xs font-bold text-white shadow-[0_4px_10px_rgba(13,148,136,0.13)] transition-colors hover:bg-teal-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crown className="size-4" aria-hidden />}
          {enabled ? `Upgrade Sekarang — Rp${formatIdr(priceIdr)}` : "Upgrade tidak tersedia"}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-warm">
          Pembayaran via QRIS. Peran reseller aktif otomatis setelah lunas.
        </p>
      </div>
    </div>
  );
}
