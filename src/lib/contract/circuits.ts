/**
 * Circuit identifiers exported by the KAIROS contract.
 *
 * These mirror the `export circuit` declarations in contracts/kairos.compact and
 * are used to type ZK config lookups, so a typo fails at compile time rather
 * than as a missing zkir file at proving time.
 */
export type KairosCircuitId =
  | 'submitPosition'
  | 'closeMarket'
  | 'revealPosition'
  | 'settleMarket'
  | 'finalizeMarket'
  | 'startNextMarket'
  | 'flip';

export const KAIROS_CIRCUIT_IDS: readonly KairosCircuitId[] = [
  'submitPosition',
  'closeMarket',
  'revealPosition',
  'settleMarket',
  'finalizeMarket',
  'startNextMarket',
  'flip',
];
