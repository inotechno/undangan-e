// k6 smoke test - jalankan dengan:
//   docker run -i --network host grafana/k6 run - < scripts/smoke-k6.js
// atau (bila k6 terpasang lokal):
//   k6 run scripts/smoke-k6.js
// Base URL bisa di-override: BASE_URL=https://undangane.id k6 run ...
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const SLUG = __ENV.INVITE_SLUG || "kirana-galih";
const errorRate = new Rate("custom_errors");

export const options = {
  scenarios: {
    smoke: {
      executor: "constant-vus",
      vus: 2,
      duration: "45s",
      gracefulStop: "5s",
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    custom_errors: ["rate<0.01"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const res = http.get(BASE + "/", { redirects: 5 });
  const okHome =
    check(res, { "home 200": (r) => r.status === 200 }) &&
    check(res, { "home html": (r) => (r.headers["Content-Type"] || "").includes("text/html") });
  errorRate.add(!okHome);

  const inv = http.get(`${BASE}/i/${SLUG}`, { redirects: 5 });
  const okInv =
    check(inv, { "invite 200": (r) => r.status === 200 }) &&
    check(inv, {
      "invite canonical tanpa query": (r) =>
        !r.body.includes('rel="canonical" href="' + BASE + `/i/${SLUG}?`),
    });
  errorRate.add(!okInv);

  const og = http.get(`${BASE}/i/${SLUG}/opengraph-image`, { redirects: 5 });
  const okOg =
    check(og, { "og-image 200": (r) => r.status === 200 }) &&
    check(og, { "og-image png": (r) => (r.headers["Content-Type"] || "").includes("image/png") }) &&
    check(og, { "og-image width header": (r) => r.headers["x-nextjs-cache"] !== undefined || r.status === 200 });
  errorRate.add(!okOg);

  const tpl = http.get(BASE + "/template/pastel-garden", { redirects: 5 });
  errorRate.add(!check(tpl, { "template detail 200": (r) => r.status === 200 }));

  const sm = http.get(BASE + "/sitemap.xml", { redirects: 5 });
  errorRate.add(
    !check(sm, {
      "sitemap 200": (r) => r.status === 200,
      "sitemap berisi template": (r) => r.body.includes("/template/"),
    }),
  );

  const rb = http.get(BASE + "/robots.txt", { redirects: 5 });
  errorRate.add(
    !check(rb, {
      "robots 200": (r) => r.status === 200,
      "robots disallow dashboard": (r) => r.body.includes("/dashboard/"),
    }),
  );

  sleep(1);
}
