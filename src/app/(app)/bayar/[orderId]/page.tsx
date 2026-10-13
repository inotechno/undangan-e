import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/auth/guard";
import { expireOrderIfNeeded } from "@/modules/payments/orders";
import { isPaymentSimulationEnabled } from "@/modules/payments/duitku";
import { PayClient } from "./pay-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Pembayaran — UndanganE",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ orderId: string }> };

export default async function BayarPage({ params }: Props) {
  const { session, roles } = await requireAuth();
  const { orderId } = await params;
  const view = await expireOrderIfNeeded(orderId);
  if (!view) notFound();
  if (!roles.includes("admin") && view.ownerId !== session.user.id) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col justify-center lg:h-[calc(100dvh-152px)]">
      <PayClient
        orderId={view.id}
        kind={view.kind}
        status={view.status}
        unitPriceIdr={view.unitPriceIdr}
        discountAmountIdr={view.discountAmountIdr}
        finalAmountIdr={view.finalAmountIdr}
        feePercent={view.feePercent}
        feeAmountIdr={view.feeAmountIdr}
        feeBorneByBuyer={view.feeBorneByBuyer}
        taxPercent={view.taxPercent}
        taxAmountIdr={view.taxAmountIdr}
        taxBorneByBuyer={view.taxBorneByBuyer}
        payableAmountIdr={view.payableAmountIdr}
        voucherCode={view.voucherCode}
        qrString={view.qrString}
        paymentUrl={view.paymentUrl}
        attemptExpiresAt={view.attemptExpiresAt?.toISOString() ?? null}
        invitationSlug={view.invitationSlug}
        canSimulate={isPaymentSimulationEnabled()}
      />
    </div>
  );
}
