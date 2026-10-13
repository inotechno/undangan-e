"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initial: {
    feePercent: number;
    feeBorneByBuyer: boolean;
    taxPercent: number;
    taxBorneByBuyer: boolean;
  };
};

const labelCls = "text-[10px] font-bold tracking-wide text-[#687b88] uppercase";
const inputCls =
  "mt-1 h-9 w-full rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal";

function ToggleRow(props: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={props.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e4ebee] p-3">
      <input
        id={props.id}
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-teal"
      />
      <span>
        <span className="block text-xs font-bold text-[#142c3c]">{props.label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-[#687b88]">{props.hint}</span>
      </span>
    </label>
  );
}

export function PaymentFeesForm({ initial }: Props) {
  const router = useRouter();
  const [feePercent, setFeePercent] = useState(String(initial.feePercent));
  const [taxPercent, setTaxPercent] = useState(String(initial.taxPercent));
  const [feeBorne, setFeeBorne] = useState(initial.feeBorneByBuyer);
  const [taxBorne, setTaxBorne] = useState(initial.taxBorneByBuyer);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const fee = Number(feePercent.replace(",", "."));
      const tax = Number(taxPercent.replace(",", "."));
      if (!Number.isFinite(fee) || fee < 0 || fee > 100 || !Number.isFinite(tax) || tax < 0 || tax > 100) {
        setMsg({ tone: "err", text: "Persentase harus antara 0 dan 100" });
        return;
      }
      const res = await fetch("/api/admin/settings/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feePercent: fee, taxPercent: tax, feeBorneByBuyer: feeBorne, taxBorneByBuyer: taxBorne }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ tone: "err", text: data.error ?? "Gagal menyimpan pengaturan" });
        return;
      }
      setMsg({ tone: "ok", text: "Pengaturan fee & pajak diperbarui" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
    >
      <h2 className="text-[15px] font-bold">Fee &amp; Pajak Pembayaran</h2>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[#687b88]">
        Dihitung dari harga setelah diskon, di-snapshot ke setiap order. Fee disetel berdasarkan MDR
        Duitku; pajak (PPN) bila berlaku. Tarif hanya berlaku untuk order baru/order yang belum dibayar.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Biaya layanan / MDR (%)</span>
          <input
            value={feePercent}
            onChange={(e) => setFeePercent(e.target.value)}
            inputMode="decimal"
            required
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Pajak / PPN (%)</span>
          <input
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            inputMode="decimal"
            required
            className={inputCls}
          />
        </label>
        <ToggleRow
          id="fee-borne"
          label="Bebankan biaya layanan ke pembeli"
          hint="Aktif = nominal fee ikut menambah total yang dibayar via QRIS. Nonaktif = hanya dicatat (ditanggung merchant)."
          checked={feeBorne}
          onChange={setFeeBorne}
        />
        <ToggleRow
          id="tax-borne"
          label="Bebankan pajak ke pembeli"
          hint="Aktif = nominal pajak ikut menambah total yang dibayar via QRIS. Nonaktif = hanya dicatat."
          checked={taxBorne}
          onChange={setTaxBorne}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex h-9 items-center rounded-lg bg-teal px-4 text-[11px] font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>

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
