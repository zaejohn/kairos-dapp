/**
 * KAIROS private state and witnesses.
 *
 * Everything in this file lives only on the user's machine. The values here are
 * handed to the Compact circuits during proof generation and are never written
 * to the ledger — the contract sees them only through `witness` declarations,
 * and only hash outputs ever leave the private domain.
 *
 * See contracts/kairos.compact for the contract-side view of the same data.
 */

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from '@managed/kairos/contract/index.js';

/** 32 bytes, matching the Bytes<32> witness return types in the contract. */
export const SECRET_BYTES = 32 as const;

/** Conviction weight bounds, mirroring minWeight/maxWeight in the contract. */
export const MIN_WEIGHT = 1n;
export const MAX_WEIGHT = 1_000_000n;

/**
 * The private state for a single user's participation in one market.
 *
 * - `secret`  derives the per-market nullifier. Reusing it across markets is
 *             safe: the contract folds marketId into the hash, so the nullifiers
 *             stay unlinkable between markets.
 * - `nonce`   makes the commitment hiding. Without it, an observer could brute
 *             force the (small) space of side/weight pairs and recover a
 *             position directly from the commitment.
 * - `side`    and `weight` are the actual conviction being expressed.
 */
export type KairosPrivateState = {
  readonly secret: Uint8Array;
  readonly side: bigint;
  readonly weight: bigint;
  readonly nonce: Uint8Array;
};

/** Cryptographically random bytes, using the browser/Node WebCrypto CSPRNG. */
export const randomBytes = (length: number): Uint8Array => {
  const out = new Uint8Array(length);
  globalThis.crypto.getRandomValues(out);
  return out;
};

export const createKairosPrivateState = (init: {
  side: bigint;
  weight: bigint;
  secret?: Uint8Array;
  nonce?: Uint8Array;
}): KairosPrivateState => ({
  secret: init.secret ?? randomBytes(SECRET_BYTES),
  side: init.side,
  weight: init.weight,
  nonce: init.nonce ?? randomBytes(SECRET_BYTES),
});

/** A private state with no position expressed yet. */
export const emptyKairosPrivateState = (): KairosPrivateState =>
  createKairosPrivateState({ side: 0n, weight: MIN_WEIGHT });

/**
 * Witness implementations.
 *
 * The Compact compiler generates a `[privateState, value]` return for every
 * witness, so each of these returns the state unchanged alongside its value.
 */
export const witnesses = {
  localSecret: (
    context: WitnessContext<Ledger, KairosPrivateState>,
  ): [KairosPrivateState, Uint8Array] => [context.privateState, context.privateState.secret],

  positionSide: (
    context: WitnessContext<Ledger, KairosPrivateState>,
  ): [KairosPrivateState, bigint] => [context.privateState, context.privateState.side],

  positionWeight: (
    context: WitnessContext<Ledger, KairosPrivateState>,
  ): [KairosPrivateState, bigint] => [context.privateState, context.privateState.weight],

  positionNonce: (
    context: WitnessContext<Ledger, KairosPrivateState>,
  ): [KairosPrivateState, Uint8Array] => [context.privateState, context.privateState.nonce],

  /**
   * Division, delegated off-chain because Compact has no integer division
   * operator. The contract re-verifies the result with `r < y` and
   * `q * y + r == x`, so returning anything other than the true quotient makes
   * proof generation fail rather than corrupting treasury accounting.
   *
   * Only ever called on public values (flip amounts and tax rates), so this
   * witness never observes private data.
   */
  divMod: (
    context: WitnessContext<Ledger, KairosPrivateState>,
    x: bigint,
    y: bigint,
  ): [KairosPrivateState, [bigint, bigint]] => [context.privateState, [x / y, x % y]],
};
