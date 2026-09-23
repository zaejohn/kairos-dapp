import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum MarketState { OPEN = 0, CLOSED = 1, SETTLED = 2, FINALIZED = 3 }

export enum Side { NONE = 0, A = 1, B = 2 }

export type Witnesses<PS> = {
  localSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  positionSide(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  positionWeight(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  positionNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  divMod(context: __compactRuntime.WitnessContext<Ledger, PS>,
         x_0: bigint,
         y_0: bigint): [PS, [bigint, bigint]];
}

export type ImpureCircuits<PS> = {
  submitPosition(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  closeMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revealPosition(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settleMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  finalizeMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  startNextMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  flip(context: __compactRuntime.CircuitContext<PS>,
       direction_0: bigint,
       amount_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
}

export type ProvableCircuits<PS> = {
  submitPosition(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  closeMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revealPosition(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settleMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  finalizeMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  startNextMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  flip(context: __compactRuntime.CircuitContext<PS>,
       direction_0: bigint,
       amount_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  submitPosition(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  closeMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  revealPosition(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  settleMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  finalizeMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  startNextMarket(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  flip(context: __compactRuntime.CircuitContext<PS>,
       direction_0: bigint,
       amount_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
}

export type Ledger = {
  readonly marketId: bigint;
  readonly marketState: MarketState;
  readonly allocA: bigint;
  readonly allocB: bigint;
  readonly reserveA: bigint;
  readonly reserveB: bigint;
  readonly taxRateAtoB: bigint;
  readonly taxRateBtoA: bigint;
  readonly taxCollectedA: bigint;
  readonly taxCollectedB: bigint;
  commitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  revealedAt: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  readonly tallyA: bigint;
  readonly tallyB: bigint;
  readonly positionCount: bigint;
  readonly winner: Side;
  readonly lastRebalanceBps: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
