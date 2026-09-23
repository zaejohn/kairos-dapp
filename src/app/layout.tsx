import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kairos | Private market signal on Midnight",
  description: "A bounded private market signal that sets a public treasury allocation policy on Midnight Preprod.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
