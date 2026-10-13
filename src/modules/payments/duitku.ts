import { createHmac } from "node:crypto";
import { env } from "@/core/config";

export type InvoiceResult = {
  reference: string;
  qrString: string;
  paymentUrl: string | null;
  paymentMethod: string;
  expiresAt: Date;
  raw: Record<string, unknown>;
};

/**
 * Mode dummy aktif saat kredensial Duitku belum diisi di .env,
 * atau saat DUITKU_FORCE_DUMMY=true (runtime — untuk pengujian lokal tanpa
 * menyentuh kredensial sandbox di .env).
 */
export function isDummyPayment(): boolean {
  return (
    process.env.DUITKU_FORCE_DUMMY === "true" ||
    !env.DUITKU_MERCHANT_CODE ||
    !env.DUITKU_API_KEY
  );
}

/**
 * Tombol "Tandai Lunas (Simulasi)" hanya untuk pengembangan:
 * mode dummy, atau env ALLOW_PAYMENT_SIMULATION=true (mis. sandbox + demo lokal).
 */
export function isPaymentSimulationEnabled(): boolean {
  return isDummyPayment() || process.env.ALLOW_PAYMENT_SIMULATION === "true";
}

function apiKey(): string {
  return isDummyPayment() ? "dummy-api-key" : env.DUITKU_API_KEY!;
}

function merchantCode(): string {
  return isDummyPayment() ? "DUMMY" : env.DUITKU_MERCHANT_CODE!;
}

function hmacHex(payload: string): string {
  return createHmac("sha256", apiKey()).update(payload).digest("hex");
}

/** Signature inquiry: HMAC_SHA256(merchantCode + merchantOrderId + paymentAmount, apiKey). */
export function inquirySignature(orderId: string, amountIdr: number): string {
  return hmacHex(merchantCode() + orderId + String(amountIdr));
}

/** Signature callback: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey). */
export function callbackSignature(amountIdr: number, orderId: string): string {
  return hmacHex(merchantCode() + String(amountIdr) + orderId);
}

function baseUrl(): string {
  return env.DUITKU_SANDBOX ? "https://sandbox.duitku.com" : "https://passport.duitku.com";
}

const INVOICE_EXPIRY_MINUTES = 60;

/**
 * Urutan kanal QRIS: NOBU (NQ) sebagai kanal utama, ShopeePay (SP) sebagai
 * fallback bila NQ bermasalah (mis. "Payment channel not available").
 * `DUITKU_QRIS_CODE` (jika diisi) menempati urutan pertama.
 */
function qrisChannels(): string[] {
  const configured = (process.env.DUITKU_QRIS_CODE ?? "").trim().toUpperCase();
  return [...new Set([configured || "NQ", "NQ", "SP"])];
}

export async function createInvoice(input: {
  orderId: string;
  amountIdr: number;
  email: string;
  customerName: string;
  productDetails: string;
}): Promise<InvoiceResult> {
  const expiresAt = new Date(Date.now() + INVOICE_EXPIRY_MINUTES * 60 * 1000);

  if (isDummyPayment()) {
    return {
      reference: `DUM-${input.orderId.slice(0, 8)}-${Date.now().toString(36)}`,
      qrString: `DUMMY-QRIS://pay?ref=${input.orderId}&amount=${input.amountIdr}`,
      paymentUrl: null,
      paymentMethod: "DUMMY",
      expiresAt,
      raw: {},
    };
  }

  let lastError = "DUITKU_INQUIRY_FAILED";

  for (const paymentMethod of qrisChannels()) {
    const res = await fetch(`${baseUrl()}/webapi/api/merchant/v2/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantCode: merchantCode(),
        paymentAmount: input.amountIdr,
        merchantOrderId: input.orderId.slice(0, 50),
        productDetails: input.productDetails.slice(0, 80),
        email: input.email,
        customerVaName: input.customerName.slice(0, 20),
        paymentMethod,
        callbackUrl:
          env.DUITKU_CALLBACK_URL ?? `${env.APP_URL}/api/webhooks/payment/duitku`,
        returnUrl: `${env.APP_URL}/bayar/${input.orderId}`,
        expiryPeriod: INVOICE_EXPIRY_MINUTES,
        signature: inquirySignature(input.orderId, input.amountIdr),
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      lastError = `DUITKU_HTTP_${res.status}_${paymentMethod}`;
      continue;
    }

    const data = (await res.json().catch(() => null)) as {
      reference?: string;
      qrString?: string;
      paymentUrl?: string;
      statusCode?: string;
    } | null;
    if (!data?.reference || !data.qrString) {
      lastError = `DUITKU_INQUIRY_FAILED_${paymentMethod}${
        data?.statusCode ? `_${data.statusCode}` : ""
      }`;
      continue;
    }

    return {
      reference: data.reference,
      qrString: data.qrString,
      paymentUrl: data.paymentUrl ?? null,
      paymentMethod,
      expiresAt,
      raw: data as Record<string, unknown>,
    };
  }

  throw new Error(lastError);
}
