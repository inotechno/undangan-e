import type { Metadata } from "next";
import { requireAuth } from "@/auth/guard";
import { listInvitations } from "@/modules/invitations/server";
import { GiftClient } from "./hadiah-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Gift Digital — UndanganE",
  robots: { index: false, follow: false },
};

export default async function GiftPage() {
  const { session } = await requireAuth();
  const items = await listInvitations(session.user.id);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Gift Digital</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Kelola informasi hadiah (rekening bank / e-wallet) yang tampil di setiap undangan.
        </p>
      </div>
      <GiftClient
        initial={items.map((inv) => ({
          id: inv.id,
          slug: inv.slug,
          status: inv.status,
          seoTitle: inv.config.seo?.title ?? null,
          coupleLabel:
            inv.config.event.couple
              ? `${inv.config.event.couple.brideName ?? ""} & ${inv.config.event.couple.groomName ?? ""}`
              : inv.config.event.host?.name ?? null,
          giftEnabled: inv.config.gift.enabled,
          giftAccounts: inv.config.gift.accounts.length,
        }))}
      />
    </div>
  );
}
