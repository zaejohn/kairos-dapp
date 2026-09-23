/**
 * The compiled KAIROS contract, wired up for midnight-js.
 *
 * `CompiledContract.make` wraps the compiler-generated `Contract` class, and
 * the witnesses are attached here so every circuit call has access to the
 * user's private state.
 */

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

import { Contract } from '@managed/kairos/contract/index.js';
import { witnesses, type KairosPrivateState } from './witnesses';

/** Stable identifier for this contract type; also used as the private-state id. */
export const KAIROS_TAG = 'kairos';

/** Where the browser fetches the zkir and prover/verifier keys from. */
export const KAIROS_ZK_ASSETS_PATH = '/zk';

export type KairosCompiledContract = ReturnType<typeof createKairosCompiledContract>;

export const createKairosCompiledContract = () =>
  CompiledContract.make(KAIROS_TAG, Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(KAIROS_ZK_ASSETS_PATH),
  );

export type { KairosPrivateState };
