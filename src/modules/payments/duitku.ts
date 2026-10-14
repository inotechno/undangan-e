import { createHmac } from "node:crypto";
import { env } from "@/core/config";
import { getPlatformSettings } from "@/modules/settings/server";

export type InvoiceResult = {
  reference: string;
  qrString: string;
  paymentUrl: string | null;
  paymentMethod: string;
  expiresAt: Date;
  raw: Record<string, unknown>;
};

/** Runtime Duitku config: settings DB (admin) menimpa env, dengan fallback env. */
export interface DuitkuRuntimeConfig {
  merchantCode: string;
  apiKey: string;
  qrisCode: string;
  sandbox: boolean;
  forceDummy: boolean;
  allowSimulation: boolean;
  callbackUrl: string;
  appUrl: string;
}

let cache: { data: DuitkuRuntimeConfig; at: number } | null = null;
const TTL_MS = 30_000;

export async function getDuitkuConfig(): Promise<DuitkuRuntimeConfig> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  let s: Awaited<ReturnType<typeof getPlatformSettings>> | null = null;
  try {
    s = await getPlatformSettings();
  } catch {
    s = null;
  }
  const merchantCode = s?.duitkuMerchantCode || env.DUITKU_MERCHANT_CODE || "";
  const apiKey = s?.duitkuApiKey || env.DUITKU_API_KEY || "";
  const forceDummy =
    s?.duitkuForceDummy === true ||
    process.env.DUITKU_FORCE_DUMMY === "true" ||
    !merchantCode ||
    !apiKey;
  const cfg: DuitkuRuntimeConfig = {
    merchantCode: forceDummy ? "DUMMY" : merchantCode,
    apiKey: forceDummy ? "dummy-api-key" : apiKey,
    qrisCode: (s?.duitkuQrisCode || process.env.DUITKU_QRIS_CODE || "").trim().toUpperCase(),
    sandbox: s?.duitkuSandbox ?? env.DUITKU_SANDBOX,
    forceDummy,
    allowSimulation: s?.allowSimulation === true || process.env.ALLOW_PAYMENT_SIMULATION === "true",
    callbackUrl: env.DUITKU_CALLBACK_URL || `${env.APP_URL}/api/webhooks/payment/duitku`,
    appUrl: env.APP_URL,
  };
  cache = { data: cfg, at: Date.now() };
  return cfg;
}

/** Paksa refresh cache (dipanggil setelah admin mengubah pengaturan). */
export function invalidateDuitkuConfigCache(): void {
  cache = null;
}

/**
 * Mode dummy aktif saat kredensial Duitku belum diisi (env maupun settings),
 * atau saat force_dummy diaktifkan admin / DUITKU_FORCE_DUMMY=true.
 */
export async function isDummyPayment(): Promise<boolean> {
  return (await getDuitkuConfig()).forceDummy;
}

/**
 * Tombol "Tandai Lunas (Simulasi)" hanya untuk pengembangan:
 * mode dummy, atau allow_simulation diaktifkan admin / ALLOW_PAYMENT_SIMULATION=true.
 */
export async function isPaymentSimulationEnabled(): Promise<boolean> {
  const cfg = await getDuitkuConfig();
  return cfg.forceDummy || cfg.allowSimulation;
}

function hmacHex(apiKey: string, payload: string): string {
  return createHmac("sha256", apiKey).update(payload).digest("hex");
}

/** Signature inquiry: HMAC_SHA256(merchantCode + merchantOrderId + paymentAmount, apiKey). */
export async function inquirySignature(orderId: string, amountIdr: number): Promise<string> {
  const cfg = await getDuitkuConfig();
  return hmacHex(cfg.apiKey, cfg.merchantCode + orderId + String(amountIdr));
}

/** Signature callback: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey). */
export async function callbackSignature(amountIdr: number, orderId: string): Promise<string> {
  const cfg = await getDuitkuConfig();
  return hmacHex(cfg.apiKey, cfg.merchantCode + String(amountIdr) + orderId);
}

/**
 * Urutan kanal QRIS: NOBU (NQ) sebagai kanal utama, ShopeePay (SP) sebagai
 * fallback bila NQ bermasalah (mis. "Payment channel not available").
 * `duitkuQrisCode` (settings admin / DUITKU_QRIS_CODE) menempati urutan pertama.
 */
function qrisChannels(cfg: DuitkuRuntimeConfig): string[] {
  return [...new Set([cfg.qrisCode || "NQ", "NQ", "SP"])];
}

function baseUrl(cfg: DuitkuRuntimeConfig): string {
  return cfg.sandbox ? "https://sandbox.duitku.com" : "https://passport.duitku.com";
}

const INVOICE_EXPIRY_MINUTES = 60;

export async function createInvoice(input: {
  orderId: string;
  amountIdr: number;
  email: string;
  customerName: string;
  productDetails: string;
}): Promise<InvoiceResult> {
  const expiresAt = new Date(Date.now() + INVOICE_EXPIRY_MINUTES * 60 * 1000);
  const cfg = await getDuitkuConfig();

  if (cfg.forceDummy) {
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
  const signature = await inquirySignature(input.orderId, input.amountIdr);

  for (const paymentMethod of qrisChannels(cfg)) {
    const res = await fetch(`${baseUrl(cfg)}/webapi/api/merchant/v2/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantCode: cfg.merchantCode,
        paymentAmount: input.amountIdr,
        merchantOrderId: input.orderId.slice(0, 50),
        productDetails: input.productDetails.slice(0, 80),
        email: input.email,
        customerVaName: input.customerName.slice(0, 20),
        paymentMethod,
        callbackUrl: cfg.callbackUrl,
        returnUrl: `${cfg.appUrl}/bayar/${input.orderId}`,
        expiryPeriod: INVOICE_EXPIRY_MINUTES,
        signature,
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
