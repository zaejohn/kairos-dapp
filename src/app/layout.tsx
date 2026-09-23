import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codex Midnight Boilerplate",
  description: "Production-oriented Next.js + Midnight starter for Codex workflows.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
