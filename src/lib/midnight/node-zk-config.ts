/**
 * Filesystem-backed ZK config provider.
 *
 * The browser uses FetchZkConfigProvider because it loads these artifacts over
 * HTTP from the app's own origin. Node-side verification (the proving
 * end-to-end test) reads the same files straight off disk instead.
 *
 * Both paths resolve to the identical artifacts produced by `compact compile`,
 * so verifying with this provider exercises the same keys the dApp ships.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  ZKConfigProvider,
  createProverKey,
  createVerifierKey,
  createZKIR,
} from '@midnight-ntwrk/midnight-js-types';

export class FileSystemZKConfigProvider<K extends string> extends ZKConfigProvider<K> {
  constructor(private readonly basePath: string) {
    super();
  }

  async getZKIR(circuitId: K) {
    const raw = await readFile(join(this.basePath, 'zkir', `${circuitId}.zkir`));
    return createZKIR(new Uint8Array(raw));
  }

  async getProverKey(circuitId: K) {
    const raw = await readFile(join(this.basePath, 'keys', `${circuitId}.prover`));
    return createProverKey(new Uint8Array(raw));
  }

  async getVerifierKey(circuitId: K) {
    const raw = await readFile(join(this.basePath, 'keys', `${circuitId}.verifier`));
    return createVerifierKey(new Uint8Array(raw));
  }
}
