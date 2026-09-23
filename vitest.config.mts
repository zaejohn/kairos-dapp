import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Contract tests run the real compiled circuits through the Compact runtime
 * simulator — no proof server required. They exercise the same artifacts that
 * ship to the browser (./managed), so the tests cover the deployed behaviour
 * rather than a reimplementation of it.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@managed': fileURLToPath(new URL('./managed', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Proof-bearing circuits are not exercised here; these are pure runtime
    // simulations, so the default timeout is generous enough.
    testTimeout: 30_000,
  },
});
