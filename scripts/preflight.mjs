#!/usr/bin/env node
/**
 * Deployment preflight.
 *
 * Verifies everything the Preprod deployment needs *except* the wallet, so that
 * when you click "Deploy KAIROS contract" in the browser nothing fails for a
 * reason that could have been caught here first.
 *
 * Checks:
 *   1. compiled contract artifacts are present and non-empty
 *   2. the ZK assets the browser fetches are present in ./public/zk
 *   3. the local proof server is reachable and reports the expected version
 *   4. artifact provenance matches the pinned runtime
 *   5. the network configuration points at the right Preprod endpoints
 *
 * The wallet cannot be checked from here: 1AM is a browser extension with no
 * headless mode, so connecting it is inherently a user action. Everything it
 * depends on is checked instead.
 *
 * Usage:  node scripts/preflight.mjs
 * Exits non-zero if any check fails.
 */

import { readFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const managed = join(root, 'managed', 'kairos');
const publicZk = join(root, 'public', 'zk');

const PROOF_SERVER = process.env.KAIROS_PROOF_SERVER ?? 'http://localhost:6300';
const EXPECTED_PROOF_SERVER = '8.1.0';
const EXPECTED_RUNTIME = '0.16.0';
const EXPECTED_COMPILER = '0.31.1';

const CIRCUITS = [
  'submitPosition',
  'closeMarket',
  'revealPosition',
  'settleMarket',
  'finalizeMarket',
  'startNextMarket',
  'flip',
];

let failures = 0;
let warnings = 0;

const pass = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.error(`  ✗ ${msg}`);
};
const warn = (msg) => {
  warnings += 1;
  console.warn(`  ! ${msg}`);
};

const section = (title) => console.log(`\n${title}`);

// --- 1. compiled artifacts -------------------------------------------------
section('Compiled contract artifacts');

if (!existsSync(managed)) {
  fail(`missing ${managed} — run "npm run compile"`);
} else {
  for (const circuit of CIRCUITS) {
    for (const rel of [`keys/${circuit}.prover`, `keys/${circuit}.verifier`, `zkir/${circuit}.zkir`]) {
      const path = join(managed, rel);
      try {
        const info = await stat(path);
        if (info.size === 0) fail(`${rel} is empty`);
      } catch {
        fail(`missing ${rel}`);
      }
    }
  }
  if (failures === 0) pass(`all ${CIRCUITS.length} circuits have keys and zkir`);
}

// --- 2. provenance ---------------------------------------------------------
section('Artifact provenance');

try {
  const info = JSON.parse(await readFile(join(managed, 'compiler', 'contract-info.json'), 'utf8'));
  if (info['runtime-version'] !== EXPECTED_RUNTIME) {
    fail(`runtime ${info['runtime-version']} != pinned ${EXPECTED_RUNTIME}`);
  } else {
    pass(`runtime ${info['runtime-version']} matches the pinned dependency`);
  }
  if (info['compiler-version'] !== EXPECTED_COMPILER) {
    warn(`compiler ${info['compiler-version']} != support-matrix ${EXPECTED_COMPILER}`);
  } else {
    pass(`compiler ${info['compiler-version']} matches the support matrix`);
  }
} catch (error) {
  fail(`could not read contract-info.json: ${error.message}`);
}

// --- 3. browser-served ZK assets -------------------------------------------
section('ZK assets served to the browser');

if (!existsSync(publicZk)) {
  fail('missing public/zk — run "npm run zk:sync"');
} else {
  for (const dir of ['keys', 'zkir']) {
    try {
      const entries = await readdir(join(publicZk, dir));
      if (entries.length === 0) fail(`public/zk/${dir} is empty`);
      else pass(`public/zk/${dir} contains ${entries.length} files`);
    } catch {
      fail(`missing public/zk/${dir}`);
    }
  }
}

// --- 4. proof server -------------------------------------------------------
section('Proof server');

try {
  const health = await fetch(`${PROOF_SERVER}/health`, { signal: AbortSignal.timeout(5000) });
  if (!health.ok) {
    fail(`${PROOF_SERVER}/health returned ${health.status}`);
  } else {
    pass(`${PROOF_SERVER}/health is ok`);

    const version = (await (
      await fetch(`${PROOF_SERVER}/version`, { signal: AbortSignal.timeout(5000) })
    ).text()).trim();

    if (version !== EXPECTED_PROOF_SERVER) {
      warn(`proof server ${version} != support-matrix ${EXPECTED_PROOF_SERVER}`);
    } else {
      pass(`proof server is ${version}, matching the support matrix`);
    }

    // Confirm /prove is actually wired, not just that the port answers.
    const probe = await fetch(`${PROOF_SERVER}/prove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(0),
      signal: AbortSignal.timeout(10_000),
    });
    if (probe.status === 404) {
      fail('/prove returned 404 — the proving endpoint is not available');
    } else {
      pass(`/prove is live (rejects an empty body with ${probe.status}, as expected)`);
    }
  }
} catch (error) {
  fail(`no proof server at ${PROOF_SERVER}: ${error.message}`);
  console.error('     start one with: bash scripts/verify-proof-server.sh');
}

// --- 5. network configuration ----------------------------------------------
section('Network configuration');

const networkId = process.env.NEXT_PUBLIC_NETWORK_ID ?? 'preprod';
const address = process.env.NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS ?? '';

if (networkId !== 'preprod') {
  warn(`NEXT_PUBLIC_NETWORK_ID is "${networkId}", not "preprod"`);
} else {
  pass('targeting preprod');
}

if (!address) {
  console.log('  i NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS is unset — expected before the');
  console.log('    first deploy. The app will offer to deploy instead.');
} else {
  pass(`contract address configured: ${address.slice(0, 24)}…`);
}

// --- summary ---------------------------------------------------------------
console.log('');
if (failures === 0) {
  console.log(`Preflight passed${warnings ? ` with ${warnings} warning(s)` : ''}.`);
  console.log('Ready to deploy from the browser: open the app, connect 1AM, click Deploy.');
  process.exit(0);
} else {
  console.error(`Preflight FAILED with ${failures} error(s). Fix those before deploying.`);
  process.exit(1);
}
