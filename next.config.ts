import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // The Compact compiler emits ESM contract bindings together with the zkir and
  // prover/verifier key files. The bindings are imported directly from ./managed,
  // so they must be bundled rather than treated as an external package.
  transpilePackages: [],

  // Next.js 16 builds with Turbopack by default. The client bundle pulls in
  // `@midnight-ntwrk/ledger-v8`, which loads WebAssembly and references Node
  // built-ins on paths that are never reached in the browser; Turbopack
  // resolves these correctly without a custom webpack fallback.
  turbopack: {
    resolveAlias: {
      // The indexer provider expects a named `WebSocket` export, which the
      // package's browser build does not provide. See the shim for details.
      'isomorphic-ws': './src/lib/shims/isomorphic-ws.ts',
    },
  },
};

export default nextConfig;
