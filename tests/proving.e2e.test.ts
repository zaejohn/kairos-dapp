/**
 * ZK artifact and proof-server integration checks.
 *
 * The rest of the suite runs circuits through the Compact runtime simulator,
 * which exercises circuit *logic* but never produces a proof. This file covers
 * the artefacts and infrastructure around proving:
 *
 *   - every circuit has a loadable, non-empty zkir, prover key and verifier key
 *   - the combined key material the proof provider requests is resolvable
 *   - a real proof server is reachable and running the expected image version
 *
 * What this file deliberately does NOT claim: it does not generate a proof.
 * Proving a circuit call requires a fully-formed ledger transaction (a real
 * ZswapChainState and contract address), which in practice comes from a
 * deployed contract. Proof generation is therefore verified by the deployment
 * step, not here — see README "Deployment". Stating that plainly is better than
 * a test that appears to verify proving but quietly proves nothing: an earlier
 * version of this file proved a *deploy* transaction, which carries verifier
 * keys onto the chain but contains no circuit proof, so it passed without ever
 * contacting the proof server.
 *
 * The proof-server check skips automatically when nothing is listening, so the
 * normal suite stays runnable without Docker. Start one with:
 *   docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readFile, stat } from 'node:fs/promises';

import { FileSystemZKConfigProvider } from '@/lib/midnight/node-zk-config';
import { KAIROS_CIRCUIT_IDS, type KairosCircuitId } from '@/lib/contract/circuits';

const PROOF_SERVER = process.env.KAIROS_PROOF_SERVER ?? 'http://localhost:6300';
const MANAGED_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'managed', 'kairos');

/** The image tag the proof server is expected to be running. */
const EXPECTED_PROOF_SERVER_VERSION = '8.1.0';

const proofServerVersion = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${PROOF_SERVER}/version`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    return (await response.text()).trim();
  } catch {
    return null;
  }
};

let serverVersion: string | null = null;

beforeAll(async () => {
  serverVersion = await proofServerVersion();
  if (serverVersion === null) {
    console.warn(
      `\n[proving.e2e] No proof server at ${PROOF_SERVER} — server checks will be skipped.\n` +
        'Start one with:\n' +
        '  docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v\n',
    );
  }
});

describe('KAIROS — ZK artifacts', () => {
  it('has a loadable zkir, prover key and verifier key for every circuit', async () => {
    const zk = new FileSystemZKConfigProvider<KairosCircuitId>(MANAGED_DIR);

    for (const circuitId of KAIROS_CIRCUIT_IDS) {
      const [zkir, proverKey, verifierKey] = await Promise.all([
        zk.getZKIR(circuitId),
        zk.getProverKey(circuitId),
        zk.getVerifierKey(circuitId),
      ]);

      expect(zkir, `${circuitId}.zkir`).toBeDefined();
      expect(proverKey, `${circuitId}.prover`).toBeDefined();
      expect(verifierKey, `${circuitId}.verifier`).toBeDefined();
    }
  });

  it('has a non-empty file on disk for every circuit artifact', async () => {
    for (const circuitId of KAIROS_CIRCUIT_IDS) {
      for (const relPath of [
        `keys/${circuitId}.prover`,
        `keys/${circuitId}.verifier`,
        `zkir/${circuitId}.zkir`,
        `zkir/${circuitId}.bzkir`,
      ]) {
        const info = await stat(join(MANAGED_DIR, relPath));
        expect(info.size, `${relPath} should not be empty`).toBeGreaterThan(0);
      }
    }
  });

  it('resolves combined key material through ZKConfigProvider.get', async () => {
    // This is the exact call the HTTP proof provider makes before proving.
    const zk = new FileSystemZKConfigProvider<KairosCircuitId>(MANAGED_DIR);
    const config = await zk.get('flip');
    expect(config).toBeDefined();
  });

  it('records compiler provenance consistent with the support matrix', async () => {
    const raw = await readFile(join(MANAGED_DIR, 'compiler', 'contract-info.json'), 'utf8');
    const info = JSON.parse(raw);

    expect(info['compiler-version']).toBe('0.31.1');
    // The contract's runtime version must line up with the pinned
    // @midnight-ntwrk/compact-runtime dependency.
    expect(info['runtime-version']).toBe('0.16.0');
    expect(basename(MANAGED_DIR)).toBe('kairos');
  });
});

describe('KAIROS — proof server', () => {
  it('is reachable and running the expected version', async () => {
    if (serverVersion === null) {
      console.warn('[proving.e2e] skipping: no proof server reachable');
      return;
    }

    expect(serverVersion).toBe(EXPECTED_PROOF_SERVER_VERSION);
  });

  it('reports healthy', async () => {
    if (serverVersion === null) {
      console.warn('[proving.e2e] skipping: no proof server reachable');
      return;
    }

    const response = await fetch(`${PROOF_SERVER}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    expect(response.status).toBe(200);
  });
});
