import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

/** CSP umum (app publik + undangan). frame-ancestors 'self' agar tetap bisa di-embed domain sendiri. */
const CSP_COMMON = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // 'unsafe-inline' untuk inline bootstrap Next + style; eval hanya demi kompatibilitas pihak ketiga peta.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: ws: wss:",
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com https://player.vimeo.com https://zoom.us https://*.zoom.us",
  "frame-ancestors 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
];

/** CSP area privat (admin/dashboard): dilarang di-iframe pihak lain. */
const CSP_PRIVATE = CSP_COMMON.map((r) => (r.startsWith("frame-ancestors") ? "frame-ancestors 'none'" : r));

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },
  allowedDevOrigins: process.env.APP_URL ? [new URL(process.env.APP_URL).host] : [],
  outputFileTracingIncludes: {
    "/*": ["node_modules/sharp/**/*", "node_modules/@img/**/*", "node_modules/jszip/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    const globalHeaders: Array<{ key: string; value: string }> = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];
    if (isProd) globalHeaders.push({ key: "Content-Security-Policy", value: CSP_COMMON.join("; ") });

    const privateHeaders: Array<{ key: string; value: string }> = [
      { key: "X-Frame-Options", value: "DENY" },
    ];
    if (isProd) privateHeaders.push({ key: "Content-Security-Policy", value: CSP_PRIVATE.join("; ") });

    return [
      { source: "/(.*)", headers: globalHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/dashboard/:path*", headers: privateHeaders },
    ];
  },
};

export default nextConfig;
