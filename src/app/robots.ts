import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/deployment/site";

export default function robots(): MetadataRoute.Robots {
  const site = publicSiteUrl();
  if (!site) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/zk/"] },
    sitemap: `${site.origin}/sitemap.xml`,
  };
}
