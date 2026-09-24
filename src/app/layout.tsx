import type { Metadata } from "next";
import { publicSiteUrl } from "@/lib/deployment/site";
import "./globals.css";

const site = publicSiteUrl();

export const metadata: Metadata = {
  title: "Kairos | Private market signal on Midnight",
  description: "A bounded private market signal that sets a public treasury allocation policy on Midnight Preprod.",
  metadataBase: site ?? undefined,
  alternates: site ? { canonical: "/" } : undefined,
  robots: { index: Boolean(site), follow: Boolean(site) },
  openGraph: site ? {
    type: "website",
    url: site.origin,
    title: "Kairos | Private market signal on Midnight",
    description: "A bounded private market signal on Midnight Preprod.",
  } : undefined,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
