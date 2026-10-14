import type { Metadata } from "next";
import { getSessionWithRoles } from "@/auth/guard";
import { getSettingNumber, getSettingBoolean } from "@/modules/payments/pricing";
import { ResellerClient } from "./reseller-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Reseller — UndanganE",
  robots: { index: false, follow: false },
};

export default async function ResellerPage() {
  const auth = await getSessionWithRoles();
  const isReseller = auth?.roles.includes("reseller") ?? false;
  const isAdmin = auth?.isAdmin ?? false;
  const [price, enabled] = await Promise.all([
    getSettingNumber("reseller.upgrade_price_idr", 50000),
    getSettingBoolean("reseller.upgrade_enabled", true),
  ]);
  return (
    <div className="mx-auto max-w-2xl">
      <ResellerClient isReseller={isReseller || isAdmin} priceIdr={price} enabled={enabled} />
    </div>
  );
}
