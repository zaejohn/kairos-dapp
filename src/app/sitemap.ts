import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/deployment/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = publicSiteUrl();
  return site ? [{ url: site.origin, changeFrequency: "weekly", priority: 1 }] : [];
}
