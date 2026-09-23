import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "isomorphic-ws": { browser: "./src/lib/midnight/browser-websocket.ts" },
    },
  },
};

export default nextConfig;
