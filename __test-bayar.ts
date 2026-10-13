const BASE = "http://localhost:3000";
(async () => {
  const sign = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: "demo@undangane.id", password: "password12345" }),
  });
  console.log("signin:", sign.status);
  const cookie = (sign.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  if (!sign.ok) { console.log(await sign.text()); return; }

  const order = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie, Origin: BASE },
    body: JSON.stringify({ invitationId: "f5268560-cacb-4da8-92f2-1a42fe072638", idempotencyKey: "e2e-bayar-" + Date.now() }),
  });
  const orderData = await order.json();
  console.log("order:", order.status, JSON.stringify(orderData));
  if (!orderData.orderId) return;

  const page = await fetch(`${BASE}/bayar/${orderData.orderId}`, { headers: { Cookie: cookie } });
  const html = await page.text();
  console.log("page:", page.status);
  console.log("hasQrString:", html.includes("000201"));
  console.log("hasPaymentUrl:", html.includes("Buka Halaman Pembayaran"));
  console.log("hasCountdown:", html.includes("Berlaku"));
  console.log("hasNoInvoiceButton:", html.includes("Buat Tagihan"));

  const status = await fetch(`${BASE}/api/orders/${orderData.orderId}/status`, { headers: { Cookie: cookie } });
  console.log("status:", JSON.stringify(await status.json()));
  console.log("ORDER_ID=" + orderData.orderId);
})();
