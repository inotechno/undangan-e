"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  QrCode,
  RefreshCw,
  ScanLine,
  Smartphone,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIdr } from "@/core/money";
import { cn } from "@/lib/utils";

type Breakdown = {
  unitPriceIdr: number;
  discountAmountIdr: number;
  voucherCode: string | null;
  finalAmountIdr: number;
  feePercent: number;
  feeAmountIdr: number;
  feeBorneByBuyer: boolean;
  taxPercent: number;
  taxAmountIdr: number;
  taxBorneByBuyer: boolean;
  payableAmountIdr: number;
};

type Invoice = {
  qrString: string;
  paymentUrl: string | null;
  expiresAt: string | null;
};

type Props = {
  orderId: string;
  kind: string;
  status: string;
  unitPriceIdr: number;
  discountAmountIdr: number;
  finalAmountIdr: number;
  feePercent: number;
  feeAmountIdr: number;
  feeBorneByBuyer: boolean;
  taxPercent: number;
  taxAmountIdr: number;
  taxBorneByBuyer: boolean;
  payableAmountIdr: number;
  voucherCode: string | null;
  qrString: string | null;
  paymentUrl: string | null;
  attemptExpiresAt: string | null;
  invitationSlug: string | null;
  canSimulate: boolean;
};

function breakdownFromProps(p: Props): Breakdown {
  return {
    unitPriceIdr: p.unitPriceIdr,
    discountAmountIdr: p.discountAmountIdr,
    voucherCode: p.voucherCode,
    finalAmountIdr: p.finalAmountIdr,
    feePercent: p.feePercent,
    feeAmountIdr: p.feeAmountIdr,
    feeBorneByBuyer: p.feeBorneByBuyer,
    taxPercent: p.taxPercent,
    taxAmountIdr: p.taxAmountIdr,
    taxBorneByBuyer: p.taxBorneByBuyer,
    payableAmountIdr: p.payableAmountIdr,
  };
}

export function PayClient(props: Props) {
  const [breakdown, setBreakdown] = useState<Breakdown>(() => breakdownFromProps(props));
  // Pulihkan tagihan yang masih pending dari server (reload / kembali dari paymentUrl).
  // Hanya saat status order awaiting_payment — attempt expired jangan dipulihkan.
  const [invoice, setInvoice] = useState<Invoice | null>(() =>
    props.status === "awaiting_payment" && props.qrString
      ? { qrString: props.qrString, paymentUrl: props.paymentUrl, expiresAt: props.attemptExpiresAt }
      : null,
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [paid, setPaid] = useState(props.status === "paid");
  const [expired, setExpired] = useState(props.status === "expired");
  const [busyPay, setBusyPay] = useState(false);
  const [busyVoucher, setBusyVoucher] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const payableIdr = breakdown.payableAmountIdr > 0 ? breakdown.payableAmountIdr : breakdown.finalAmountIdr;
  const shortOrderId = props.orderId.slice(0, 8).toUpperCase();
  const title = props.kind === "reseller_upgrade" ? "Upgrade Reseller" : "Publikasi Undangan";

  useEffect(() => {
    if (paid || !invoice?.qrString) return;
    let cancelled = false;
    void import("qrcode")
      .then((QRCode) => QRCode.toDataURL(invoice.qrString, { width: 220, margin: 1 }))
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [invoice?.qrString, paid]);

  const refreshFromServer = useCallback(async () => {
    const res = await fetch(`/api/orders/${props.orderId}/status`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { paid: boolean; status: string };
    if (data.paid) {
      setPaid(true);
      setExpired(false);
    } else if (data.status === "expired") {
      setExpired(true);
    }
  }, [props.orderId]);

  useEffect(() => {
    if (paid) return;
    pollRef.current = setInterval(() => void refreshFromServer(), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paid, refreshFromServer]);

  useEffect(() => {
    const iso = invoice?.expiresAt;
    if (paid || !iso) return;
    const compute = () => {
      const ms = new Date(iso).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [invoice?.expiresAt, paid]);

  useEffect(() => {
    if (secondsLeft === 0 && !paid && !expired) {
      const t = setTimeout(() => void refreshFromServer(), 0);
      return () => clearTimeout(t);
    }
  }, [secondsLeft, paid, expired, refreshFromServer]);

  /** Klik "Bayar" — terbitkan tagihan QRIS, QR tampil di halaman yang sama. */
  async function pay() {
    setBusyPay(true);
    setNote(null);
    try {
      const res = await fetch(`/api/orders/${props.orderId}/pay`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        qrString?: string | null;
        paymentUrl?: string | null;
        expiresAt?: string | null;
      };
      if (!res.ok || !data.qrString) {
        setNote(data.error ?? "Gagal membuat tagihan, coba lagi");
        return;
      }
      setExpired(false);
      setInvoice({ qrString: data.qrString, paymentUrl: data.paymentUrl ?? null, expiresAt: data.expiresAt ?? null });
    } finally {
      setBusyPay(false);
    }
  }

  function applyBreakdown(b: Record<string, unknown>) {
    setBreakdown((prev) => ({
      unitPriceIdr: (b.unitPriceIdr as number) ?? prev.unitPriceIdr,
      discountAmountIdr: (b.discountAmountIdr as number) ?? prev.discountAmountIdr,
      voucherCode: (b.voucherCode as string | null) ?? null,
      finalAmountIdr: (b.finalAmountIdr as number) ?? prev.finalAmountIdr,
      feePercent: (b.feePercent as number) ?? prev.feePercent,
      feeAmountIdr: (b.feeAmountIdr as number) ?? prev.feeAmountIdr,
      feeBorneByBuyer: (b.feeBorneByBuyer as boolean) ?? prev.feeBorneByBuyer,
      taxPercent: (b.taxPercent as number) ?? prev.taxPercent,
      taxAmountIdr: (b.taxAmountIdr as number) ?? prev.taxAmountIdr,
      taxBorneByBuyer: (b.taxBorneByBuyer as boolean) ?? prev.taxBorneByBuyer,
      payableAmountIdr: (b.payableAmountIdr as number) ?? prev.payableAmountIdr,
    }));
  }

  async function applyVoucher() {
    const code = voucherInput.trim();
    if (!code) return;
    setBusyVoucher(true);
    setNote(null);
    try {
      const res = await fetch(`/api/orders/${props.orderId}/voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; breakdown?: Record<string, unknown> };
      if (!res.ok || !data.breakdown) {
        setNote(data.error ?? "Gagal memakai voucher");
        return;
      }
      applyBreakdown(data.breakdown);
      setInvoice(null);
      setVoucherInput("");
    } finally {
      setBusyVoucher(false);
    }
  }

  async function removeVoucher() {
    setBusyVoucher(true);
    setNote(null);
    try {
      const res = await fetch(`/api/orders/${props.orderId}/voucher`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; breakdown?: Record<string, unknown> };
      if (!res.ok || !data.breakdown) {
        setNote(data.error ?? "Gagal melepas voucher");
        return;
      }
      applyBreakdown(data.breakdown);
      setInvoice(null);
    } finally {
      setBusyVoucher(false);
    }
  }

  async function copyOrderId() {
    try {
      await navigator.clipboard.writeText(props.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  async function simulatePay() {
    setBusyPay(true);
    setNote(null);
    try {
      const res = await fetch(`/api/dev/simulate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: props.orderId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNote(data.error ?? "Gagal mensimulasikan pembayaran");
        return;
      }
      await refreshFromServer();
    } finally {
      setBusyPay(false);
    }
  }

  const countdown =
    secondsLeft !== null
      ? `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`
      : null;

  const shellCls =
    "overflow-hidden rounded-2xl border border-border-warm bg-white shadow-[0_12px_36px_rgba(18,40,59,0.07)]";

  // ── Sudah lunas ─────────────────────────────────────────────
  if (paid) {
    return (
      <div className={cn(shellCls, "px-8 py-10 text-center")}>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/10">
          <CheckCircle2 className="size-7 text-teal" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Pembayaran Berhasil</h1>
        <p className="text-muted-warm mx-auto mt-2 max-w-md text-sm leading-relaxed">
          {props.kind === "reseller_upgrade"
            ? "Selamat! Anda sekarang reseller. Harga khusus reseller aktif untuk undangan berikutnya."
            : "Undangan Anda sudah aktif dan siap dibagikan kepada tamu."}
        </p>
        <p className="text-muted-warm mt-2 font-mono text-xs">ID Pesanan: #{shortOrderId}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {props.invitationSlug ? (
            <Link
              href={`/i/${props.invitationSlug}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-teal px-6 text-sm font-semibold text-white transition-colors hover:bg-teal-hover"
            >
              Lihat Undangan
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-xl border border-border-warm px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-muted",
              props.invitationSlug ? "" : "bg-teal border-teal text-white hover:bg-teal-hover",
            )}
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Panel kiri: rincian biaya ───────────────────────────────
  const statusChip = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        expired
          ? "bg-amber-100 text-amber-700"
          : invoice
            ? "bg-teal/10 text-teal"
            : "bg-muted text-muted-warm",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          expired ? "bg-amber-500" : invoice ? "bg-teal" : "bg-muted-warm",
        )}
        aria-hidden
      />
      {expired ? "Kedaluwarsa" : invoice ? "Tagihan terbit" : "Menunggu pembayaran"}
    </span>
  );

  const rincian = (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          <p className="text-muted-warm mt-0.5 text-sm">Bayar sekali via QRIS — tanpa langganan.</p>
        </div>
        {statusChip}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-warm">ID Pesanan</span>
        <button
          type="button"
          onClick={() => void copyOrderId()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 font-mono text-xs font-semibold text-charcoal transition-colors hover:bg-border-warm"
          title="Salin ID pesanan"
        >
          #{shortOrderId}
          {copied ? (
            <CheckCircle2 className="size-3.5 text-teal" aria-hidden />
          ) : (
            <Copy className="size-3.5 text-muted-warm" aria-hidden />
          )}
        </button>
      </div>

      <dl className="mt-4 divide-y divide-border-warm text-sm">
        <div className="flex items-center justify-between py-2">
          <dt className="text-muted-warm">Harga</dt>
          <dd className="font-medium">{formatIdr(breakdown.unitPriceIdr)}</dd>
        </div>
        {breakdown.discountAmountIdr > 0 ? (
          <div className="flex items-center justify-between py-2 text-teal">
            <dt className="inline-flex items-center gap-1.5 font-medium">
              <Tag className="size-4" aria-hidden />
              Diskon {breakdown.voucherCode ? `(${breakdown.voucherCode})` : ""}
            </dt>
            <dd className="font-semibold">−{formatIdr(breakdown.discountAmountIdr)}</dd>
          </div>
        ) : null}
        {breakdown.feePercent > 0 ? (
          <div className="flex items-center justify-between py-2">
            <dt className="text-muted-warm">
              Biaya layanan ({breakdown.feePercent}%)
              {!breakdown.feeBorneByBuyer ? <span className="text-muted-warm/70 text-[11px]"> · ditanggung penjual</span> : null}
            </dt>
            <dd className={cn("font-medium", !breakdown.feeBorneByBuyer && "text-muted-warm/60")}>
              {formatIdr(breakdown.feeAmountIdr)}
            </dd>
          </div>
        ) : null}
        {breakdown.taxPercent > 0 ? (
          <div className="flex items-center justify-between py-2">
            <dt className="text-muted-warm">
              Pajak / PPN ({breakdown.taxPercent}%)
              {!breakdown.taxBorneByBuyer ? <span className="text-muted-warm/70 text-[11px]"> · ditanggung penjual</span> : null}
            </dt>
            <dd className={cn("font-medium", !breakdown.taxBorneByBuyer && "text-muted-warm/60")}>
              {formatIdr(breakdown.taxAmountIdr)}
            </dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-base font-bold">Total</dt>
          <dd className="text-xl font-extrabold tracking-tight text-teal">{formatIdr(payableIdr)}</dd>
        </div>
      </dl>

      {props.kind !== "reseller_upgrade" ? (
        <div className="mt-4 rounded-xl border border-dashed border-border-warm p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal">
            <Tag className="size-3.5 text-muted-warm" aria-hidden />
            Kode voucher
          </p>
          {breakdown.voucherCode ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="rounded-lg bg-teal/10 px-2.5 py-1.5 font-mono text-xs font-bold text-teal">
                {breakdown.voucherCode}
              </span>
              <button
                type="button"
                onClick={() => void removeVoucher()}
                disabled={busyVoucher || paid}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
              >
                {busyVoucher ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                Hapus
              </button>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                placeholder="Masukkan kode voucher"
                disabled={busyVoucher}
                className="h-10 w-full rounded-xl border border-border-warm bg-white px-3.5 text-sm outline-none transition-colors focus-visible:border-teal disabled:opacity-60"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-10 shrink-0 rounded-xl px-4 text-xs font-bold"
                onClick={() => void applyVoucher()}
                disabled={busyVoucher || !voucherInput.trim()}
              >
                {busyVoucher ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Pakai
              </Button>
            </div>
          )}
          <p className="text-muted-warm mt-2 text-[11px] leading-relaxed">
            Voucher dapat diubah selama tagihan belum dibayar.
          </p>
        </div>
      ) : null}

      <p className="text-muted-warm mt-auto flex items-center gap-1.5 pt-4 text-[11px]">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        Pembayaran diproses oleh Duitku · QRIS resmi · Terenkripsi &amp; tercatat di audit log
      </p>
    </div>
  );

  // ── Panel kanan: pembayaran ─────────────────────────────────
  let panel: React.ReactNode;
  if (expired && !invoice) {
    panel = (
      <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-100">
          <RefreshCw className="size-5 text-amber-600" aria-hidden />
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight">Pembayaran Kedaluwarsa</h2>
        <p className="text-muted-warm mt-1.5 max-w-xs text-sm leading-relaxed">
          Waktu pembayaran habis. Terbitkan tagihan baru untuk melanjutkan.
        </p>
        <Button size="lg" className="mt-5 h-11 rounded-xl px-8 text-sm font-bold" onClick={() => void pay()} disabled={busyPay}>
          {busyPay ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
          Buat Tagihan Baru
        </Button>
      </div>
    );
  } else if (!invoice) {
    const steps = [
      { icon: QrCode, text: "Klik “Bayar Sekarang” — tagihan QRIS terbit langsung" },
      { icon: ScanLine, text: "Scan QR dengan aplikasi bank / e-wallet apa pun" },
      { icon: CheckCircle2, text: "Pembayaran lunas terdeteksi otomatis (±5 detik)" },
    ];
    panel = (
      <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-warm">Total yang dibayar</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-teal sm:text-4xl">{formatIdr(payableIdr)}</p>
        <Button
          className="mt-4 h-12 w-full rounded-xl text-sm font-bold shadow-[0_6px_16px_rgba(13,148,136,0.25)]"
          onClick={() => void pay()}
          disabled={busyPay}
        >
          {busyPay ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <QrCode className="size-4" aria-hidden />}
          {busyPay ? "Membuat tagihan..." : "Bayar Sekarang"}
        </Button>
        <ol className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-teal/25 bg-teal/5 text-[10px] font-bold text-teal">
                {i + 1}
              </span>
              <span className="flex items-start gap-2 text-[13px] leading-snug text-charcoal/80">
                <s.icon className="mt-0.5 size-3.5 shrink-0 text-muted-warm" aria-hidden />
                {s.text}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-muted-warm mt-5 flex items-center gap-1.5 text-[11px]">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          Tagihan berlaku 60 menit · diproses oleh Duitku
        </p>
      </div>
    );
  } else {
    panel = (
      <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto p-5 text-center sm:p-6">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">Scan QRIS untuk Membayar</h2>
        <div className="mt-3">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Kode QR pembayaran QRIS"
              className="mx-auto size-44 rounded-2xl border border-border-warm bg-white p-2 shadow-sm sm:size-48"
            />
          ) : (
            <div className="mx-auto flex size-44 items-center justify-center rounded-2xl border border-border-warm sm:size-48">
              <Loader2 className="size-6 animate-spin text-muted-warm" aria-hidden />
            </div>
          )}
          <p className="mt-3 break-all rounded-xl bg-muted p-2 font-mono text-[10px] leading-relaxed">{invoice.qrString}</p>
        </div>
        <p className="text-muted-warm mt-2.5 inline-flex items-center justify-center gap-1.5 text-xs">
          <Smartphone className="size-3.5 shrink-0" aria-hidden />
          Scan dengan aplikasi bank / e-wallet yang mendukung QRIS
        </p>
        {countdown ? (
          <p className="mt-2 inline-flex w-fit items-center justify-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal" aria-live="polite">
            Berlaku {countdown} lagi
          </p>
        ) : null}
        <p className="mt-2 text-sm font-semibold">
          {formatIdr(payableIdr)} <span className="text-muted-warm font-normal">· Tagihan #{shortOrderId}</span>
        </p>
        <button
          type="button"
          onClick={() => void copyOrderId()}
          className="mx-auto mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 font-mono text-[11px] text-charcoal transition-colors hover:bg-border-warm"
          title="Salin merchant order ID (untuk simulasi pembayaran Duitku)"
        >
          <span className="text-muted-warm shrink-0">Merchant Order ID:</span>
          <span className="truncate">{props.orderId}</span>
          {copied ? (
            <CheckCircle2 className="size-3.5 shrink-0 text-teal" aria-hidden />
          ) : (
            <Copy className="size-3.5 shrink-0 text-muted-warm" aria-hidden />
          )}
        </button>
        <div className="mt-3 space-y-2">
          {invoice.paymentUrl ? (
            <a
              href={invoice.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-warm px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-white"
            >
              <ExternalLink className="size-4" aria-hidden />
              Buka Halaman Pembayaran
            </a>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-full rounded-xl text-xs font-bold"
            onClick={() => void pay()}
            disabled={busyPay}
          >
            {busyPay ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
            Buat QR baru
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:h-full">
      <div className={cn(shellCls, "grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]")}>
        <div className="min-h-0 border-b border-border-warm lg:border-b-0 lg:border-r">{rincian}</div>
        <div className="min-h-0 bg-[#f5faf9]">{panel}</div>
      </div>

      {props.canSimulate && !paid ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-[11px] leading-snug text-amber-800">
            <strong>Mode demo.</strong> QR bersifat simulasi; tombol meniru callback sukses Duitku.
          </p>
          <Button size="sm" className="h-8 shrink-0 rounded-lg text-xs" onClick={() => void simulatePay()} disabled={busyPay}>
            {busyPay ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            Tandai Lunas (Simulasi)
          </Button>
        </div>
      ) : null}

      {note ? (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm font-medium text-red-600" role="alert">
          {note}
        </p>
      ) : null}
    </div>
  );
}
