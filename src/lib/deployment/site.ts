export function publicSiteUrl(env: Readonly<{ VERCEL_ENV?: string; KAIROS_SITE_URL?: string }> = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  KAIROS_SITE_URL: process.env.KAIROS_SITE_URL,
}): URL | null {
  if (env.VERCEL_ENV !== "production") return null;
  try {
    const url = new URL(env.KAIROS_SITE_URL ?? "");
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}
