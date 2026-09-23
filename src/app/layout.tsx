import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KAIROS — Confidential Treasury',
  description:
    'A confidential, self-rebalancing DeFi treasury on Midnight. Express conviction privately; the protocol reallocates toward the winner.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
