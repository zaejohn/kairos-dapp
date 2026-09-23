'use client';

import { Button, Card, Chip, Notice, Stat } from './ui';
import { formatBps } from '@/lib/format';
import { MarketState, Side, type Ledger } from '@managed/kairos/contract/index.js';
import type { TxPhase } from '@/hooks/useKairos';

/** Human-readable lifecycle label for each on-chain state. */
const STATE_LABEL: Record<MarketState, string> = {
  [MarketState.OPEN]: 'Open — accepting private positions',
  [MarketState.CLOSED]: 'Closed — reveals accepted',
  [MarketState.SETTLED]: 'Settled — treasury reallocated',
  [MarketState.FINALIZED]: 'Finalized — ready for the next market',
};

const STATE_TONE = {
  [MarketState.OPEN]: 'success',
  [MarketState.CLOSED]: 'pending',
  [MarketState.SETTLED]: 'a',
  [MarketState.FINALIZED]: 'neutral',
} as const;

const winnerLabel = (winner: Side): string =>
  winner === Side.A ? 'Token A' : winner === Side.B ? 'Token B' : 'No winner (tie)';

/**
 * The current decision market: its stage, the revealed conviction totals, the
 * last resolved outcome, and the lifecycle controls.
 *
 * Each control is enabled only in the state the contract will accept it in, so
 * the UI cannot offer a transition that would revert.
 */
export const MarketPanel = ({
  ledger,
  tx,
  canAct,
  onClose,
  onSettle,
  onFinalize,
  onNext,
}: {
  ledger: Ledger;
  tx: TxPhase;
  canAct: boolean;
  onClose: () => void;
  onSettle: () => void;
  onFinalize: () => void;
  onNext: () => void;
}) => {
  const busy = tx.kind === 'proving';
  const { marketState } = ledger;

  return (
    <Card
      title={`Market #${ledger.marketId}`}
      subtitle="Should the next treasury allocation favor Token A or Token B?"
      actions={
        <Chip tone={STATE_TONE[marketState]}>
          {MarketState[marketState].toLowerCase()}
        </Chip>
      }
    >
      <p className="mb-5 text-xs text-[var(--color-ink-muted)]">{STATE_LABEL[marketState]}</p>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label="Commitments" value={ledger.positionCount.toString()} />
        <Stat label="Revealed → A" value={ledger.tallyA.toString()} accent="a" />
        <Stat label="Revealed → B" value={ledger.tallyB.toString()} accent="b" />
        {/* `winner` is per-market state and resets when the next market opens,
            so this reports the current market's outcome rather than a running
            "last winner" that the contract does not actually retain. */}
        <Stat
          label="Winner"
          value={ledger.winner === Side.NONE ? '—' : winnerLabel(ledger.winner)}
          hint={
            ledger.winner === Side.NONE && ledger.marketState === MarketState.SETTLED
              ? 'tied'
              : undefined
          }
        />
      </dl>

      {ledger.lastRebalanceBps > 0n && (
        <div className="mt-5">
          <Notice>
            Treasury moved <span className="tabular">{formatBps(ledger.lastRebalanceBps)}</span>{' '}
            toward {winnerLabel(ledger.winner)} at the last settlement.
          </Notice>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={!canAct || busy || marketState !== MarketState.OPEN}
        >
          Close market
        </Button>
        <Button
          variant="primary"
          onClick={onSettle}
          disabled={!canAct || busy || marketState !== MarketState.CLOSED}
        >
          Settle &amp; reallocate
        </Button>
        <Button
          variant="secondary"
          onClick={onFinalize}
          disabled={!canAct || busy || marketState !== MarketState.SETTLED}
        >
          Finalize
        </Button>
        <Button
          variant="secondary"
          onClick={onNext}
          disabled={!canAct || busy || marketState !== MarketState.FINALIZED}
        >
          Start next market
        </Button>
      </div>

      {marketState === MarketState.CLOSED && ledger.tallyA === 0n && ledger.tallyB === 0n && (
        <div className="mt-4">
          <Notice tone="warning">
            No positions have been revealed. Settling now resolves as a tie, which leaves the
            allocation unchanged.
          </Notice>
        </div>
      )}
    </Card>
  );
};
