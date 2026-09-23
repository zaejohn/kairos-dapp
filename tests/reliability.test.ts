/**
 * Reliability coverage.
 *
 * Two things are verified here that the main suite does not cover:
 *
 *  1. The lifecycle as an exhaustive transition matrix. Rather than testing the
 *     transitions we happened to think of, this walks every (state, circuit)
 *     pair and asserts which ones the contract accepts. That is the difference
 *     between "we tested some invalid transitions" and "every transition has a
 *     defined outcome".
 *
 *  2. The presentation arithmetic. Basis-point formatting and allocation widths
 *     are display-only, but a bug there would misreport the treasury, so they
 *     are tested against the edge cases that actually occur (0%, 100%, values
 *     that do not divide evenly).
 */

import { describe, it, expect } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { KairosSimulator } from '@/lib/contract/simulator';
import { createKairosPrivateState, type KairosPrivateState } from '@/lib/contract/witnesses';
import { MarketState } from '@managed/kairos/contract/index.js';
import { allocationWidths, formatBps, formatAmount } from '@/lib/format';
import { truncateAddress } from '@/lib/midnight/wallet';

setNetworkId('undeployed');

const participant = (side: bigint, weight: bigint): KairosPrivateState =>
  createKairosPrivateState({ side, weight });

/**
 * Drive a market into the requested lifecycle stage and return the participant
 * who filed the position.
 *
 * The filer is returned because a reveal only works with the exact secret and
 * nonce behind the commitment — a fresh participant with a new random secret
 * derives a different nullifier and is correctly rejected.
 */
const advanceTo = (sim: KairosSimulator, target: MarketState): KairosPrivateState => {
  const filer = participant(0n, 10n);
  if (target === MarketState.OPEN) return filer;

  sim.actingAs(filer);
  sim.submitPosition();
  sim.closeMarket();
  if (target === MarketState.CLOSED) return filer;

  sim.actingAs(filer);
  sim.revealPosition();
  sim.settleMarket();
  if (target === MarketState.SETTLED) return filer;

  sim.finalizeMarket();
  return filer;
};

/**
 * Every circuit that participates in the lifecycle, with a representative call.
 * `filer` is whoever filed the market's position, so a reveal uses the matching
 * opening rather than an unrelated one.
 */
const TRANSITIONS: Array<{
  name: string;
  call: (sim: KairosSimulator, filer: KairosPrivateState) => void;
}> = [
  {
    name: 'submitPosition',
    call: (sim) => {
      sim.actingAs(participant(0n, 25n));
      sim.submitPosition();
    },
  },
  { name: 'closeMarket', call: (sim) => sim.closeMarket() },
  {
    name: 'revealPosition',
    call: (sim, filer) => {
      sim.actingAs(filer);
      sim.revealPosition();
    },
  },
  { name: 'settleMarket', call: (sim) => sim.settleMarket() },
  { name: 'finalizeMarket', call: (sim) => sim.finalizeMarket() },
  { name: 'startNextMarket', call: (sim) => sim.startNextMarket() },
];

/**
 * The lifecycle: which circuits are legal in which state.
 *
 * OPEN      -> submitPosition, closeMarket
 * CLOSED    -> revealPosition, settleMarket
 * SETTLED   -> finalizeMarket
 * FINALIZED -> startNextMarket
 */
const LEGAL: Record<string, MarketState[]> = {
  submitPosition: [MarketState.OPEN],
  closeMarket: [MarketState.OPEN],
  revealPosition: [MarketState.CLOSED],
  settleMarket: [MarketState.CLOSED],
  finalizeMarket: [MarketState.SETTLED],
  startNextMarket: [MarketState.FINALIZED],
};

const STATES: Array<[string, MarketState]> = [
  ['OPEN', MarketState.OPEN],
  ['CLOSED', MarketState.CLOSED],
  ['SETTLED', MarketState.SETTLED],
  ['FINALIZED', MarketState.FINALIZED],
];

describe('KAIROS — exhaustive lifecycle transition matrix', () => {
  for (const [stateName, state] of STATES) {
    for (const transition of TRANSITIONS) {
      const allowed = LEGAL[transition.name].includes(state);
      const verb = allowed ? 'accepts' : 'rejects';

      it(`${verb} ${transition.name} while ${stateName}`, () => {
        const sim = new KairosSimulator();
        // A reveal needs a commitment to reveal, which advanceTo files.
        const filer = advanceTo(sim, state);
        expect(sim.getLedger().marketState).toEqual(state);

        if (allowed) {
          expect(() => transition.call(sim, filer)).not.toThrow();
        } else {
          expect(() => transition.call(sim, filer)).toThrow();
        }
      });
    }
  }

  it('leaves the market state untouched after every rejected transition', () => {
    for (const [stateName, state] of STATES) {
      for (const transition of TRANSITIONS) {
        if (LEGAL[transition.name].includes(state)) continue;

        const sim = new KairosSimulator();
        const filer = advanceTo(sim, state);
        const before = sim.getLedger().marketState;

        try {
          transition.call(sim, filer);
        } catch {
          // expected
        }

        expect(sim.getLedger().marketState, `${transition.name} in ${stateName}`).toEqual(before);
      }
    }
  });
});

describe('KAIROS — repeated and adversarial sequences', () => {
  it('is unaffected by many rejected submissions in a row', () => {
    const sim = new KairosSimulator();
    const alice = participant(1n, 50n);

    sim.actingAs(alice);
    sim.submitPosition();

    for (let i = 0; i < 5; i++) {
      expect(() => sim.submitPosition()).toThrow();
    }

    const l = sim.getLedger();
    expect(l.positionCount).toEqual(1n);
    expect(l.commitments.size()).toEqual(1n);
  });

  it('survives a long run of complete market cycles with stable invariants', () => {
    const sim = new KairosSimulator();

    for (let cycle = 0; cycle < 12; cycle++) {
      const side = cycle % 3 === 0 ? 1n : 0n;
      const alice = participant(side, 100n);

      sim.actingAs(alice);
      sim.submitPosition();
      sim.closeMarket();
      sim.actingAs(alice);
      sim.revealPosition();
      sim.settleMarket();

      const l = sim.getLedger();
      // The treasury invariant must hold after every single settlement.
      expect(l.allocA + l.allocB, `cycle ${cycle}`).toEqual(10_000n);
      expect(l.allocA).toBeLessThanOrEqual(9_000n);
      expect(l.allocB).toBeLessThanOrEqual(9_000n);

      sim.finalizeMarket();
      sim.startNextMarket();
    }

    // marketId advanced once per cycle, and the nullifier space stayed disjoint.
    expect(sim.getLedger().marketId).toEqual(13n);
    expect(sim.getLedger().commitments.size()).toEqual(12n);
  });

  it('does not let a rejected reveal mark the position as revealed', () => {
    const sim = new KairosSimulator();
    const alice = participant(0n, 100n);

    sim.actingAs(alice);
    sim.submitPosition();
    sim.closeMarket();

    // A mismatched opening must fail without consuming the reveal slot.
    sim.actingAs(
      createKairosPrivateState({ side: 1n, weight: 5n, secret: alice.secret, nonce: alice.nonce }),
    );
    expect(() => sim.revealPosition()).toThrow();
    expect(sim.getLedger().revealedAt.size()).toEqual(0n);

    // The genuine opening still works afterwards.
    sim.actingAs(alice);
    expect(() => sim.revealPosition()).not.toThrow();
    expect(sim.getLedger().tallyA).toEqual(100n);
  });

  it('keeps tax accounting exact across many flips', () => {
    const sim = new KairosSimulator();
    let expectedTaxA = 0n;
    let expectedTaxB = 0n;

    for (let i = 0; i < 10; i++) {
      const amount = 1_000n + BigInt(i);
      expectedTaxA += (amount * 100n) / 10_000n;
      sim.flip(0n, amount);

      expectedTaxB += (amount * 300n) / 10_000n;
      sim.flip(1n, amount);
    }

    const l = sim.getLedger();
    expect(l.taxCollectedA).toEqual(expectedTaxA);
    expect(l.taxCollectedB).toEqual(expectedTaxB);
  });
});

describe('display arithmetic', () => {
  it('formats basis points as percentages without float drift', () => {
    expect(formatBps(10_000n)).toBe('100%');
    expect(formatBps(5_000n)).toBe('50%');
    expect(formatBps(2_000n)).toBe('20%');
    expect(formatBps(100n)).toBe('1%');
    expect(formatBps(300n)).toBe('3%');
    expect(formatBps(0n)).toBe('0%');
    expect(formatBps(150n)).toBe('1.5%');
    expect(formatBps(1n)).toBe('0.01%'); // one basis point
  });

  it('always produces allocation widths summing to exactly 100', () => {
    const cases: Array<[bigint, bigint]> = [
      [5_000n, 5_000n],
      [7_000n, 3_000n],
      [9_000n, 1_000n],
      [1n, 9_999n],
      [0n, 10_000n],
      [10_000n, 0n],
      [3_333n, 6_667n],
    ];

    for (const [a, b] of cases) {
      const widths = allocationWidths(a, b);
      expect(widths.a + widths.b, `${a}/${b}`).toBe(100);
      expect(widths.a).toBeGreaterThanOrEqual(0);
      expect(widths.a).toBeLessThanOrEqual(100);
    }
  });

  it('groups amounts readably', () => {
    expect(formatAmount(0n)).toBe('0');
    expect(formatAmount(1_000n)).toBe('1,000');
    expect(formatAmount(1_000_000n)).toBe('1,000,000');
  });

  it('truncates long addresses but leaves short ones intact', () => {
    expect(truncateAddress('short')).toBe('short');
    expect(truncateAddress('mn_addr_preprod1abcdefghijklmnop')).toContain('…');
    expect(truncateAddress('mn_addr_preprod1abcdefghijklmnop').length).toBeLessThan(32);
  });
});
