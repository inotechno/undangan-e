import type { MetadataRoute } from "next";
import { env } from "@/core/config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = env.APP_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Route privat: (group app) → /dashboard, /undangan, /bayar; /admin; API internal.
        disallow: ["/dashboard/", "/undangan/", "/bayar/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
