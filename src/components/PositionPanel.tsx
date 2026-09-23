'use client';

import { useState } from 'react';

import { Button, Card, Chip, Field, Notice, inputClass } from './ui';
import { MAX_WEIGHT, MIN_WEIGHT, type KairosPrivateState } from '@/lib/contract/witnesses';
import { MarketState, type Ledger } from '@managed/kairos/contract/index.js';
import { isPending, type TxPhase } from '@/hooks/useKairos';

type Side = 0n | 1n;

const SIDE_LABEL: Record<string, string> = { '0': 'Token A', '1': 'Token B' };

/**
 * Private position entry.
 *
 * The side and weight chosen here are witnesses. They are used to derive a
 * commitment and a nullifier locally, and only those two hashes are submitted —
 * so the selection is not visible in the transaction's public effect.
 */
export const PositionPanel = ({
  ledger,
  tx,
  canAct,
  myPosition,
  onSubmit,
  onReveal,
}: {
  ledger: Ledger;
  tx: TxPhase;
  canAct: boolean;
  myPosition: KairosPrivateState | null;
  onSubmit: (side: bigint, weight: bigint) => void;
  onReveal: () => void;
}) => {
  const [side, setSide] = useState<Side>(0n);
  const [weight, setWeight] = useState('100');
  const [parseError, setParseError] = useState<string | null>(null);

  // Locked for the entire pending window, not just proving: the wallet
  // refuses a second transaction while one is still in flight.
  const busy = isPending(tx);
  const isOpen = ledger.marketState === MarketState.OPEN;
  const isClosed = ledger.marketState === MarketState.CLOSED;

  // A position authored for an earlier market must not be offerable for reveal
  // in this one, so the panel tracks whether one has been filed here.
  const hasPosition = myPosition !== null;

  const handleSubmit = () => {
    setParseError(null);

    let parsed: bigint;
    try {
      parsed = BigInt(weight.trim());
    } catch {
      setParseError('Weight must be a whole number.');
      return;
    }

    if (parsed < MIN_WEIGHT || parsed > MAX_WEIGHT) {
      setParseError(
        `Weight must be between ${MIN_WEIGHT.toString()} and ${MAX_WEIGHT.toString()}.`,
      );
      return;
    }

    onSubmit(side, parsed);
  };

  return (
    <Card
      title="Your position"
      subtitle="Conviction is expressed privately and committed on-chain as a hash."
      actions={<Chip tone="pending">Private</Chip>}
    >
      <div className="flex gap-2">
        {([0n, 1n] as const).map((value) => {
          const active = side === value;
          const accent =
            value === 0n ? 'var(--color-side-a)' : 'var(--color-side-b)';
          return (
            <button
              key={value.toString()}
              type="button"
              onClick={() => setSide(value)}
              disabled={!isOpen || busy}
              aria-pressed={active}
              className="flex-1 rounded-lg border px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: active ? accent : 'var(--color-border-strong)',
                color: active ? accent : 'var(--color-ink-muted)',
                backgroundColor: active ? `color-mix(in oklab, ${accent} 10%, transparent)` : 'transparent',
              }}
            >
              Back {SIDE_LABEL[value.toString()]}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <Field
          label="Conviction weight"
          hint={`Between ${MIN_WEIGHT.toString()} and ${MAX_WEIGHT.toString()}. Never leaves your browser in the clear.`}
        >
          <input
            className={inputClass}
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            inputMode="numeric"
            disabled={!isOpen || busy}
            aria-label="Conviction weight"
          />
        </Field>
      </div>

      {parseError && (
        <div className="mt-3">
          <Notice tone="danger">{parseError}</Notice>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canAct || busy || !isOpen}
        >
          Submit private position
        </Button>
        <Button
          variant="secondary"
          onClick={onReveal}
          disabled={!canAct || busy || !isClosed || !hasPosition}
          title={
            !hasPosition
              ? 'This browser holds no unrevealed position for the current market.'
              : undefined
          }
        >
          Reveal position
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {hasPosition && isOpen && (
          <Notice>
            A position is committed for this market. Its side and weight are private until you
            reveal it after the market closes.
          </Notice>
        )}

        {isClosed && hasPosition && (
          <Notice tone="warning">
            The market is closed. Reveal your position to have it counted — unrevealed positions
            do not contribute to the tally.
          </Notice>
        )}

        {isClosed && !hasPosition && (
          <Notice>
            This browser holds no position for this market, so there is nothing to reveal.
          </Notice>
        )}

        <Notice>
          Your position becomes public when you reveal it. Until then only a commitment hash and
          an unlinkable nullifier are on-chain.
        </Notice>
      </div>
    </Card>
  );
};
