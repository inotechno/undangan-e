export const ORDER_STATUS_LABEL: Record<string, string> = {
  created: "Dibuat",
  awaiting_payment: "Menunggu Bayar",
  paid: "Lunas",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  refunded: "Refund",
};

export const ORDER_STATUS_CLASS: Record<string, string> = {
  created: "bg-[#f0f3f6] text-[#607080]",
  awaiting_payment: "bg-[#fff7df] text-[#a16207]",
  paid: "bg-[#e9f8ef] text-[#15803d]",
  cancelled: "bg-[#fff0f2] text-[#be123c]",
  expired: "bg-[#fff0f2] text-[#be123c]",
  refunded: "bg-[#eef4ff] text-[#2563eb]",
};

export const INVITATION_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  awaiting_payment: "Menunggu Bayar",
  active: "Aktif",
  expired: "Kedaluwarsa",
  archived: "Diarsipkan",
};

export const INVITATION_STATUS_CLASS: Record<string, string> = {
  draft: "bg-[#f0f3f6] text-[#607080]",
  awaiting_payment: "bg-[#fff7df] text-[#a16207]",
  active: "bg-[#e9f8ef] text-[#15803d]",
  expired: "bg-[#fff0f2] text-[#be123c]",
  archived: "bg-[#f0f3f6] text-[#607080]",
};

export const ORDER_KIND_LABEL: Record<string, string> = {
  invitation: "Publikasi",
  reseller_upgrade: "Upgrade Reseller",
};

export function formatIdr(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export function formatDateTime(d: Date) {
  return (
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

/** Tipe data baris (aman dipakai client — tanpa import server). */
export type AdminInvitationRow = {
  id: string;
  slug: string;
  status: string;
  eventType: string;
  title: string;
  ownerName: string;
  ownerEmail: string;
  updatedAt: string;
};

export type AdminOrderRow = {
  id: string;
  kind: string;
  status: string;
  finalAmountIdr: number;
  ownerName: string;
  ownerEmail: string;
  invitationSlug: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
  createdAt: string;
  roles: string[];
  invitationCount: number;
};

export type AdminResellerRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  upgradeOrderId: string | null;
  upgradePaidAt: string | null;
  invitationCount: number;
};

export type AdminAuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorName: string;
  meta: Record<string, unknown>;
  createdAt: string;
};
