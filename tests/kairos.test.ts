/**
 * KAIROS contract tests.
 *
 * These run the real compiled circuits from ./managed through the Compact
 * runtime simulator. No proof server is involved, so the suite is fast and
 * deterministic, but the circuit logic, assertions and disclosure rules under
 * test are exactly those that execute on-chain.
 */

import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { KairosSimulator } from '@/lib/contract/simulator';
import { createKairosPrivateState, type KairosPrivateState } from '@/lib/contract/witnesses';
import { MarketState, Side } from '@managed/kairos/contract/index.js';

setNetworkId('undeployed');

// Basis points used across the treasury assertions.
const TOTAL_BPS = 10_000n;
const START_BPS = 5_000n;
const STEP_BPS = 2_000n;
const CEILING_BPS = 9_000n;

/** A participant with their own secret, nonce, side and weight. */
const participant = (side: bigint, weight: bigint): KairosPrivateState =>
  createKairosPrivateState({ side, weight });

/**
 * Drive a market from OPEN to SETTLED with the given revealed positions, then
 * return the settled ledger. Each entry is [side, weight].
 */
const settleWith = (
  sim: KairosSimulator,
  positions: Array<[bigint, bigint]>,
): void => {
  const users = positions.map(([side, weight]) => participant(side, weight));
  for (const user of users) {
    sim.actingAs(user);
    sim.submitPosition();
  }
  sim.closeMarket();
  for (const user of users) {
    sim.actingAs(user);
    sim.revealPosition();
  }
  sim.settleMarket();
};

describe('KAIROS — initialisation', () => {
  it('generates identical initial ledger state deterministically', () => {
    // The Map fields on the decoded ledger carry runtime closures, so a deep
    // equality on the whole object compares those closures rather than state.
    // Determinism of initialisation is the scalar state plus map sizes.
    const snapshot = (sim: KairosSimulator) => {
      const l = sim.getLedger();
      return {
        marketId: l.marketId,
        marketState: l.marketState,
        allocA: l.allocA,
        allocB: l.allocB,
        reserveA: l.reserveA,
        reserveB: l.reserveB,
        taxRateAtoB: l.taxRateAtoB,
        taxRateBtoA: l.taxRateBtoA,
        taxCollectedA: l.taxCollectedA,
        taxCollectedB: l.taxCollectedB,
        tallyA: l.tallyA,
        tallyB: l.tallyB,
        positionCount: l.positionCount,
        winner: l.winner,
        lastRebalanceBps: l.lastRebalanceBps,
        commitments: l.commitments.size(),
        revealed: l.revealedAt.size(),
      };
    };

    expect(snapshot(new KairosSimulator())).toEqual(snapshot(new KairosSimulator()));
  });

  it('starts with a balanced treasury, the configured tax rates, and an open market', () => {
    const l = new KairosSimulator().getLedger();

    expect(l.marketId).toEqual(1n);
    expect(l.marketState).toEqual(MarketState.OPEN);
    expect(l.allocA).toEqual(START_BPS);
    expect(l.allocB).toEqual(START_BPS);
    expect(l.winner).toEqual(Side.NONE);
    expect(l.positionCount).toEqual(0n);

    // Asymmetric by design: 1% into A, 3% into B.
    expect(l.taxRateAtoB).toEqual(100n);
    expect(l.taxRateBtoA).toEqual(300n);
  });

  it('sets the initial allocation invariant A + B == 10000 bps', () => {
    const l = new KairosSimulator().getLedger();
    expect(l.allocA + l.allocB).toEqual(TOTAL_BPS);
  });
});

describe('KAIROS — private position submission', () => {
  it('files a commitment and increments the public position count', () => {
    const sim = new KairosSimulator();
    sim.actingAs(participant(1n, 500n));

    const commitment = sim.submitPosition();
    const l = sim.getLedger();

    expect(l.positionCount).toEqual(1n);
    expect(l.commitments.size()).toEqual(1n);
    expect(commitment).toHaveLength(32);
  });

  it('does not write the side or the weight to public state', () => {
    const sim = new KairosSimulator();
    sim.actingAs(participant(1n, 987_654n));
    sim.submitPosition();

    const l = sim.getLedger();
    const publicValues = Object.entries(l)
      .filter(([key]) => !['commitments', 'revealedAt'].includes(key))
      .map(([, value]) => value);

    // The weight is distinctive enough that its presence anywhere in public
    // state would be obvious. Tallies stay untouched until reveal.
    expect(publicValues).not.toContain(987_654n);
    expect(l.tallyA).toEqual(0n);
    expect(l.tallyB).toEqual(0n);
  });

  it('produces different commitments for different sides at equal weight', () => {
    const a = new KairosSimulator();
    a.actingAs(participant(0n, 100n));
    const commitmentA = a.submitPosition();

    const b = new KairosSimulator();
    b.actingAs(participant(1n, 100n));
    const commitmentB = b.submitPosition();

    expect(Buffer.from(commitmentA).toString('hex')).not.toEqual(
      Buffer.from(commitmentB).toString('hex'),
    );
  });

  it('produces a different commitment when only the weight differs', () => {
    const one = new KairosSimulator();
    one.actingAs(participant(1n, 100n));
    const c1 = one.submitPosition();

    const two = new KairosSimulator();
    two.actingAs(participant(1n, 101n));
    const c2 = two.submitPosition();

    expect(Buffer.from(c1).toString('hex')).not.toEqual(
      Buffer.from(c2).toString('hex'),
    );
  });

  it('is deterministic for an identical opening', () => {
    const secret = new Uint8Array(32).fill(7);
    const nonce = new Uint8Array(32).fill(9);

    const one = new KairosSimulator();
    one.actingAs(createKairosPrivateState({ side: 1n, weight: 42n, secret, nonce }));
    const c1 = one.submitPosition();

    const two = new KairosSimulator();
    two.actingAs(createKairosPrivateState({ side: 1n, weight: 42n, secret, nonce }));
    const c2 = two.submitPosition();

    expect(Buffer.from(c1).toString('hex')).toEqual(Buffer.from(c2).toString('hex'));
  });

  it('rejects an out-of-range weight', () => {
    const sim = new KairosSimulator();

    sim.actingAs(participant(1n, 0n));
    expect(() => sim.submitPosition()).toThrow();

    sim.actingAs(participant(1n, 1_000_001n));
    expect(() => sim.submitPosition()).toThrow();
  });

  it('rejects a side that is neither A nor B', () => {
    const sim = new KairosSimulator();
    sim.actingAs(participant(2n, 10n));
    expect(() => sim.submitPosition()).toThrow();
  });
});

describe('KAIROS — replay protection', () => {
  it('rejects a second position from the same secret in the same market', () => {
    const sim = new KairosSimulator();
    const alice = participant(1n, 10n);

    sim.actingAs(alice);
    sim.submitPosition();

    expect(() => sim.submitPosition()).toThrow();
    expect(sim.getLedger().positionCount).toEqual(1n);
  });

  it('rejects a replay that changes side and weight', () => {
    const sim = new KairosSimulator();
    const alice = participant(1n, 10n);

    sim.actingAs(alice);
    sim.submitPosition();

    // Same secret, so the same nullifier — the commitment cannot be replaced.
    const secret = alice.secret;
    sim.actingAs(createKairosPrivateState({ side: 0n, weight: 999n, secret }));
    expect(() => sim.submitPosition()).toThrow();
  });

  it('allows the same participant to enter the next market', () => {
    const sim = new KairosSimulator();
    const alice = participant(1n, 10n);

    sim.actingAs(alice);
    sim.submitPosition();
    sim.closeMarket();
    sim.actingAs(alice);
    sim.revealPosition();
    sim.settleMarket();
    sim.finalizeMarket();
    sim.startNextMarket();

    const l = sim.getLedger();
    expect(l.marketId).toEqual(2n);

    // marketId is folded into the nullifier, so the same secret is usable again.
    sim.actingAs(alice);
    expect(() => sim.submitPosition()).not.toThrow();
    expect(sim.getLedger().positionCount).toEqual(1n);
  });
});

describe('KAIROS — market lifecycle enforcement', () => {
  it('refuses to close a market that is already closed', () => {
    const sim = new KairosSimulator();
    sim.closeMarket();
    expect(() => sim.closeMarket()).toThrow();
  });

  it('refuses position submission after close', () => {
    const sim = new KairosSimulator();
    sim.closeMarket();
    sim.actingAs(participant(1n, 10n));
    expect(() => sim.submitPosition()).toThrow();
  });

  it('refuses reveal before the market is closed', () => {
    const sim = new KairosSimulator();
    const alice = participant(1n, 10n);
    sim.actingAs(alice);
    sim.submitPosition();
    expect(() => sim.revealPosition()).toThrow();
  });

  it('refuses settlement before the market is closed', () => {
    const sim = new KairosSimulator();
    expect(() => sim.settleMarket()).toThrow();
  });

  it('refuses double settlement', () => {
    const sim = new KairosSimulator();
    settleWith(sim, [[1n, 10n]]);
    expect(sim.getLedger().marketState).toEqual(MarketState.SETTLED);
    expect(() => sim.settleMarket()).toThrow();
  });

  it('refuses to finalize a market that is not settled', () => {
    const sim = new KairosSimulator();
    expect(() => sim.finalizeMarket()).toThrow();
  });

  it('refuses to start the next market before finalizing', () => {
    const sim = new KairosSimulator();
    expect(() => sim.startNextMarket()).toThrow();
  });

  it('walks the full OPEN -> CLOSED -> SETTLED -> FINALIZED -> OPEN cycle', () => {
    const sim = new KairosSimulator();
    expect(sim.getLedger().marketState).toEqual(MarketState.OPEN);

    settleWith(sim, [[1n, 10n]]);
    expect(sim.getLedger().marketState).toEqual(MarketState.SETTLED);

    sim.finalizeMarket();
    expect(sim.getLedger().marketState).toEqual(MarketState.FINALIZED);

    sim.startNextMarket();
    const l = sim.getLedger();
    expect(l.marketState).toEqual(MarketState.OPEN);
    expect(l.marketId).toEqual(2n);
    expect(l.tallyA).toEqual(0n);
    expect(l.tallyB).toEqual(0n);
    expect(l.positionCount).toEqual(0n);
    expect(l.winner).toEqual(Side.NONE);
  });
});

describe('KAIROS — reveal', () => {
  it('counts a revealed position toward the matching tally', () => {
    const sim = new KairosSimulator();
    const alice = participant(0n, 300n);

    sim.actingAs(alice);
    sim.submitPosition();
    sim.closeMarket();
    sim.actingAs(alice);
    sim.revealPosition();

    const l = sim.getLedger();
    expect(l.tallyA).toEqual(300n);
    expect(l.tallyB).toEqual(0n);
  });

  it('refuses a double reveal', () => {
    const sim = new KairosSimulator();
    const alice = participant(0n, 300n);

    sim.actingAs(alice);
    sim.submitPosition();
    sim.closeMarket();
    sim.actingAs(alice);
    sim.revealPosition();

    expect(() => sim.revealPosition()).toThrow();
    expect(sim.getLedger().tallyA).toEqual(300n);
  });

  it('refuses a reveal with no commitment on file', () => {
    const sim = new KairosSimulator();
    sim.closeMarket();
    sim.actingAs(participant(1n, 10n));
    expect(() => sim.revealPosition()).toThrow();
  });

  it('refuses a reveal whose opening does not match the commitment', () => {
    const sim = new KairosSimulator();
    const alice = participant(0n, 100n);

    sim.actingAs(alice);
    sim.submitPosition();
    sim.closeMarket();

    // Same secret (so the same nullifier) but a different side and weight.
    sim.actingAs(
      createKairosPrivateState({
        side: 1n,
        weight: 999n,
        secret: alice.secret,
        nonce: alice.nonce,
      }),
    );
    expect(() => sim.revealPosition()).toThrow();

    const l = sim.getLedger();
    expect(l.tallyA).toEqual(0n);
    expect(l.tallyB).toEqual(0n);
  });

  it('refuses a reveal that tampers with only the nonce', () => {
    const sim = new KairosSimulator();
    const alice = participant(0n, 100n);

    sim.actingAs(alice);
    sim.submitPosition();
    sim.closeMarket();

    sim.actingAs(
      createKairosPrivateState({
        side: 0n,
        weight: 100n,
        secret: alice.secret,
        nonce: new Uint8Array(32).fill(1),
      }),
    );
    expect(() => sim.revealPosition()).toThrow();
  });
});

describe('KAIROS — treasury reallocation', () => {
  it('moves the treasury toward A when A wins (the documented example)', () => {
    const sim = new KairosSimulator();
    settleWith(sim, [[0n, 500n]]);

    const l = sim.getLedger();
    expect(l.winner).toEqual(Side.A);
    expect(l.allocA).toEqual(7_000n); // 50% -> 70%
    expect(l.allocB).toEqual(3_000n); // 50% -> 30%
    expect(l.lastRebalanceBps).toEqual(STEP_BPS);
  });

  it('moves the treasury toward B when B wins', () => {
    const sim = new KairosSimulator();
    settleWith(sim, [[1n, 500n]]);

    const l = sim.getLedger();
    expect(l.winner).toEqual(Side.B);
    expect(l.allocB).toEqual(7_000n);
    expect(l.allocA).toEqual(3_000n);
  });

  it('weights the outcome by revealed conviction, not by participant count', () => {
    const sim = new KairosSimulator();
    // Two participants back A, but B carries far more conviction.
    settleWith(sim, [
      [0n, 10n],
      [0n, 10n],
      [1n, 900n],
    ]);

    expect(sim.getLedger().winner).toEqual(Side.B);
  });

  it('reallocates nothing on a tie', () => {
    const sim = new KairosSimulator();
    settleWith(sim, [
      [0n, 100n],
      [1n, 100n],
    ]);

    const l = sim.getLedger();
    expect(l.winner).toEqual(Side.NONE);
    expect(l.allocA).toEqual(START_BPS);
    expect(l.allocB).toEqual(START_BPS);
    expect(l.lastRebalanceBps).toEqual(0n);
  });

  it('reallocates nothing when no positions were revealed', () => {
    const sim = new KairosSimulator();
    sim.closeMarket();
    sim.settleMarket();

    const l = sim.getLedger();
    expect(l.winner).toEqual(Side.NONE);
    expect(l.allocA).toEqual(START_BPS);
    expect(l.allocB).toEqual(START_BPS);
  });

  it('preserves the allocation invariant across repeated settlements', () => {
    const sim = new KairosSimulator();

    for (let i = 0; i < 6; i++) {
      settleWith(sim, [[0n, 10n]]);
      const l = sim.getLedger();
      expect(l.allocA + l.allocB).toEqual(TOTAL_BPS);
      sim.finalizeMarket();
      sim.startNextMarket();
    }
  });

  it('saturates at the 90% ceiling and never exceeds it', () => {
    const sim = new KairosSimulator();

    for (let i = 0; i < 5; i++) {
      settleWith(sim, [[0n, 10n]]);
      sim.finalizeMarket();
      sim.startNextMarket();
    }

    const l = sim.getLedger();
    expect(l.allocA).toEqual(CEILING_BPS);
    expect(l.allocB).toEqual(TOTAL_BPS - CEILING_BPS);
    expect(l.allocA + l.allocB).toEqual(TOTAL_BPS);
  });

  it('can move back toward B after saturating on A', () => {
    const sim = new KairosSimulator();

    for (let i = 0; i < 5; i++) {
      settleWith(sim, [[0n, 10n]]);
      sim.finalizeMarket();
      sim.startNextMarket();
    }
    expect(sim.getLedger().allocA).toEqual(CEILING_BPS);

    settleWith(sim, [[1n, 10n]]);
    const l = sim.getLedger();
    expect(l.winner).toEqual(Side.B);
    expect(l.allocA).toEqual(CEILING_BPS - STEP_BPS);
    expect(l.allocA + l.allocB).toEqual(TOTAL_BPS);
  });
});

describe('KAIROS — asymmetric flip tax', () => {
  it('applies the 1% tax on an A -> B flip and returns the net amount', () => {
    const sim = new KairosSimulator();
    const before = sim.getLedger();

    const net = sim.flip(0n, 10_000n);

    // 1% of 10,000 = 100 tax, 9,900 net.
    expect(net).toEqual(9_900n);

    const after = sim.getLedger();
    expect(after.reserveA).toEqual(before.reserveA - 9_900n);
    expect(after.reserveB).toEqual(before.reserveB + 9_900n);
    expect(after.taxCollectedA).toEqual(100n);
    expect(after.taxCollectedB).toEqual(0n);
  });

  it('applies the 3% tax on a B -> A flip', () => {
    const sim = new KairosSimulator();
    const before = sim.getLedger();

    const net = sim.flip(1n, 10_000n);

    // 3% of 10,000 = 300 tax, 9,700 net.
    expect(net).toEqual(9_700n);

    const after = sim.getLedger();
    expect(after.reserveB).toEqual(before.reserveB - 9_700n);
    expect(after.reserveA).toEqual(before.reserveA + 9_700n);
    expect(after.taxCollectedB).toEqual(300n);
    expect(after.taxCollectedA).toEqual(0n);
  });

  it('treats the two directions asymmetrically for the same amount', () => {
    const sim = new KairosSimulator();

    const netAtoB = sim.flip(0n, 100_000n);
    const netBtoA = sim.flip(1n, 100_000n);

    expect(netAtoB).toEqual(99_000n); // 1% tax
    expect(netBtoA).toEqual(97_000n); // 3% tax
    expect(netAtoB).toBeGreaterThan(netBtoA);
  });

  it('accumulates tax revenue in the treasury across flips', () => {
    const sim = new KairosSimulator();

    sim.flip(0n, 10_000n); // 100 in A
    sim.flip(0n, 10_000n); // 100 in A
    sim.flip(1n, 10_000n); // 300 in B

    const l = sim.getLedger();
    expect(l.taxCollectedA).toEqual(200n);
    expect(l.taxCollectedB).toEqual(300n);
  });

  it('conserves demo value: the net converted plus the tax retained equals the input', () => {
    const sim = new KairosSimulator();
    const before = sim.getLedger();
    const amount = 50_000n;

    const net = sim.flip(0n, amount);
    const after = sim.getLedger();

    const tax = after.taxCollectedA - before.taxCollectedA;
    const leftReserveA = before.reserveA - after.reserveA;
    const gainedReserveB = after.reserveB - before.reserveB;

    expect(net + tax).toEqual(amount);
    expect(gainedReserveB).toEqual(net);
    expect(leftReserveA).toEqual(net);
  });

  it('rejects an invalid direction', () => {
    const sim = new KairosSimulator();
    expect(() => sim.flip(2n, 1_000n)).toThrow();
  });

  it('rejects a zero amount', () => {
    const sim = new KairosSimulator();
    expect(() => sim.flip(0n, 0n)).toThrow();
  });

  it('rejects a flip larger than the source reserve', () => {
    const sim = new KairosSimulator();
    const l = sim.getLedger();

    expect(() => sim.flip(0n, l.reserveA + 1n)).toThrow();
    expect(() => sim.flip(1n, l.reserveB + 1n)).toThrow();

    // Reserve accounting is untouched by the failed attempts.
    const after = sim.getLedger();
    expect(after.reserveA).toEqual(l.reserveA);
    expect(after.reserveB).toEqual(l.reserveB);
  });

  it('leaves the treasury allocation untouched', () => {
    const sim = new KairosSimulator();
    sim.flip(0n, 10_000n);

    const l = sim.getLedger();
    expect(l.allocA).toEqual(START_BPS);
    expect(l.allocB).toEqual(START_BPS);
  });
});

describe('KAIROS — full economic loop', () => {
  it('runs conviction -> resolution -> reallocation -> flip -> tax -> next market', () => {
    const sim = new KairosSimulator();
    const alice = participant(0n, 400n);
    const bob = participant(1n, 100n);

    // Private conviction.
    sim.actingAs(alice);
    sim.submitPosition();
    sim.actingAs(bob);
    sim.submitPosition();
    expect(sim.getLedger().positionCount).toEqual(2n);

    // Resolution.
    sim.closeMarket();
    sim.actingAs(alice);
    sim.revealPosition();
    sim.actingAs(bob);
    sim.revealPosition();
    sim.settleMarket();

    // Treasury reallocated toward the winning side.
    expect(sim.getLedger().winner).toEqual(Side.A);
    expect(sim.getLedger().allocA).toEqual(7_000n);

    // Flip activity produces tax revenue.
    const taxBefore = sim.getLedger().taxCollectedB;
    sim.flip(1n, 20_000n); // B -> A, 3%
    expect(sim.getLedger().taxCollectedB).toEqual(taxBefore + 600n);

    // The treasury carries forward into the next market.
    const treasury = sim.getLedger();
    sim.finalizeMarket();
    sim.startNextMarket();

    const next = sim.getLedger();
    expect(next.marketId).toEqual(2n);
    expect(next.marketState).toEqual(MarketState.OPEN);
    expect(next.allocA).toEqual(treasury.allocA);
    expect(next.allocB).toEqual(treasury.allocB);
    expect(next.reserveA).toEqual(treasury.reserveA);
    expect(next.reserveB).toEqual(treasury.reserveB);
    expect(next.taxCollectedA).toEqual(treasury.taxCollectedA);
    expect(next.taxCollectedB).toEqual(treasury.taxCollectedB);
  });
});
