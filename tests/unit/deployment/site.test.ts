import { describe, expect, it } from "vitest";
import { publicSiteUrl } from "@/lib/deployment/site";

describe("public site metadata", () => {
  it("only exposes a validated production origin", () => {
    expect(publicSiteUrl({ VERCEL_ENV: "production", KAIROS_SITE_URL: "https://kairos.example" })?.origin).toBe("https://kairos.example");
    expect(publicSiteUrl({ VERCEL_ENV: "preview", KAIROS_SITE_URL: "https://kairos.example" })).toBeNull();
    expect(publicSiteUrl({ VERCEL_ENV: "production", KAIROS_SITE_URL: "http://kairos.example" })).toBeNull();
  });
});
