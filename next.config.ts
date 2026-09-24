import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "isomorphic-ws": { browser: "./src/lib/midnight/browser-websocket.ts" },
      "cross-fetch": { browser: "./src/lib/midnight/browser-fetch.ts" },
    },
  },
};

export default nextConfig;
