import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // The Compact compiler emits ESM contract bindings together with the zkir and
  // prover/verifier key files. The bindings are imported directly from ./managed,
  // so they must be bundled rather than treated as an external package.
  transpilePackages: [],

  // `@midnight-ntwrk/ledger-v8` loads WebAssembly and reaches for Node built-ins
  // in some code paths. None of those paths run in the browser, so they are
  // stubbed out here to keep the client bundle buildable.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
