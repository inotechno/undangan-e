"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  requireReason?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  tone = "default",
  requireReason = false,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[min(420px,92vw)] rounded-xl border border-[#e4ebee] bg-white p-0 shadow-[0_18px_50px_rgba(21,48,65,0.18)] backdrop:bg-[#142c3c]/40"
    >
      <form
        method="dialog"
        className="p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (requireReason && reason.trim().length < 3) return;
          onConfirm(reason.trim());
        }}
      >
        <h2 className="text-[15px] font-bold text-[#142c3c]">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#687b88]">{description}</p>
        ) : null}
        {requireReason ? (
          <label className="mt-4 block">
            <span className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">
              Alasan (wajib)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={3}
              maxLength={500}
              required
              rows={3}
              placeholder="Tuliskan alasan tindakan ini..."
              className="mt-1 w-full rounded-lg border border-[#e4ebee] bg-white px-2.5 py-2 text-xs outline-none focus-visible:border-teal"
            />
          </label>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-lg bg-[#fff0f2] px-3 py-2 text-[11px] font-semibold text-[#be123c]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-8 items-center rounded-lg border border-[#dbe5e9] bg-white px-3 text-[11px] font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy || (requireReason && reason.trim().length < 3)}
            className={
              tone === "danger"
                ? "inline-flex h-8 items-center rounded-lg bg-[#be123c] px-3 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                : "inline-flex h-8 items-center rounded-lg bg-teal px-3 text-[11px] font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
            }
          >
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
