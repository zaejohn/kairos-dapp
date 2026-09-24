import assert from "node:assert/strict";
import test from "node:test";
import { validateNodeVersion, validateVercelEnvironment } from "../../scripts/vercel/validate-env.mjs";

const production = {
  VERCEL_ENV: "production",
  NEXT_PUBLIC_MIDNIGHT_NETWORK: "preprod",
  NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS: "a".repeat(64),
  KAIROS_DEPLOYMENT_TX_ID: "b".repeat(64),
  KAIROS_SITE_URL: "https://kairos.example",
};

test("production accepts a complete Preprod configuration", () => {
  assert.deepEqual(validateVercelEnvironment(production), { production: true, siteUrl: "https://kairos.example" });
});

test("Vercel build requires a compatible Node 22 patch", () => {
  assert.doesNotThrow(() => validateNodeVersion("22.22.1"));
  assert.throws(() => validateNodeVersion("22.20.0"), /22.22/);
  assert.throws(() => validateNodeVersion("23.0.0"), /22.22/);
});

test("rejects every non-Preprod network", () => {
  for (const network of [undefined, "mainnet", "testnet", "preview"]) {
    assert.throws(() => validateVercelEnvironment({ ...production, NEXT_PUBLIC_MIDNIGHT_NETWORK: network }), /preprod/);
  }
});

test("fails closed when Vercel system environment variables are disabled", () => {
  assert.throws(() => validateVercelEnvironment({ NEXT_PUBLIC_MIDNIGHT_NETWORK: "preprod" }), /System Environment Variables/);
});

test("production refuses an unverified or malformed deployment configuration", () => {
  for (const key of ["NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS", "KAIROS_DEPLOYMENT_TX_ID", "KAIROS_SITE_URL"]) {
    assert.throws(() => validateVercelEnvironment({ ...production, [key]: "" }));
  }
  for (const url of ["http://kairos.example", "https://kairos.example/path", "https://user:pass@kairos.example"]) {
    assert.throws(() => validateVercelEnvironment({ ...production, KAIROS_SITE_URL: url }), /KAIROS_SITE_URL/);
  }
});

test("preview builds may omit the deployment address but stay on Preprod", () => {
  assert.deepEqual(validateVercelEnvironment({ VERCEL_ENV: "preview", NEXT_PUBLIC_MIDNIGHT_NETWORK: "preprod" }), { production: false });
});
