/**
 * In-process simulator for the KAIROS contract.
 *
 * This drives the *real* compiled circuits from ./managed through the Compact
 * runtime, so contract tests exercise the same artifacts that ship to the
 * browser. It requires no proof server and produces no proofs — circuits run as
 * plain runtime execution, which is what makes the test suite fast and fully
 * deterministic.
 *
 * Circuits that depend on a `disclose()`ed value still enforce the disclosure
 * rules, so privacy behaviour is genuinely covered here rather than mocked.
 */

import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, type Ledger, ledger } from '@managed/kairos/contract/index.js';
import {
  type KairosPrivateState,
  witnesses,
  emptyKairosPrivateState,
} from './witnesses';

export class KairosSimulator {
  readonly contract: Contract<KairosPrivateState>;
  private circuitContext: CircuitContext<KairosPrivateState>;

  constructor(privateState: KairosPrivateState = emptyKairosPrivateState()) {
    this.contract = new Contract<KairosPrivateState>(witnesses);

    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext(privateState, '0'.repeat(64)),
      );

    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  /** Current public ledger state. */
  getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  /** The private state of whichever participant is currently acting. */
  getPrivateState(): KairosPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  /**
   * Switch the acting participant. The public ledger carries over, so this is
   * how multi-user scenarios are expressed: each participant brings their own
   * secret, nonce, side and weight.
   */
  actingAs(privateState: KairosPrivateState): void {
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: privateState,
    };
  }

  // --- circuits -----------------------------------------------------------

  submitPosition(): Uint8Array {
    return this.run((ctx) => this.contract.impureCircuits.submitPosition(ctx));
  }

  closeMarket(): void {
    this.run((ctx) => this.contract.impureCircuits.closeMarket(ctx));
  }

  revealPosition(): void {
    this.run((ctx) => this.contract.impureCircuits.revealPosition(ctx));
  }

  settleMarket(): void {
    this.run((ctx) => this.contract.impureCircuits.settleMarket(ctx));
  }

  finalizeMarket(): void {
    this.run((ctx) => this.contract.impureCircuits.finalizeMarket(ctx));
  }

  startNextMarket(): void {
    this.run((ctx) => this.contract.impureCircuits.startNextMarket(ctx));
  }

  flip(direction: bigint, amount: bigint): bigint {
    return this.run((ctx) =>
      this.contract.impureCircuits.flip(ctx, direction, amount),
    );
  }

  /**
   * Execute a circuit and advance the context to its result. Circuits that
   * violate an assertion throw, which is exactly the behaviour the failure-path
   * tests rely on.
   */
  private run<T>(
    call: (ctx: CircuitContext<KairosPrivateState>) => {
      context: CircuitContext<KairosPrivateState>;
      result: T;
    },
  ): T {
    const { context, result } = call(this.circuitContext);
    this.circuitContext = context;
    return result;
  }
}
