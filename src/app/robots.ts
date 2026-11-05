import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/ar/admin", "/en/admin", "/ar/cart", "/en/cart"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
