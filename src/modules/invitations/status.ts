export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Menunggu bayar",
  active: "Terbit",
  expired: "Kedaluwarsa",
  archived: "Diarsipkan",
};

export const STATUS_CLASS: Record<string, string> = {
  draft: "border-border-warm bg-muted text-muted-warm",
  awaiting_payment: "border-blue-200 bg-blue-50 text-blue-700",
  active: "border-teal/30 bg-teal-soft text-teal",
  expired: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-border-warm bg-muted text-muted-warm",
};
