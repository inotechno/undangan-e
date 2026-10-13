import type { MetadataRoute } from "next";
import { env } from "@/core/config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = env.APP_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/admin/", "/kelola/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
