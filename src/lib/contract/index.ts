/**
 * Contract layer: the compiled KAIROS bindings plus the private state and
 * witnesses they consume.
 */

// The compiler-generated bindings (Contract class, ledger decoder, enums).
export * as KairosContract from '@managed/kairos/contract/index.js';
export type { Ledger as KairosLedger } from '@managed/kairos/contract/index.js';
export { MarketState, Side } from '@managed/kairos/contract/index.js';

export * from './witnesses';
export * from './simulator';
