'use client';

import { useMemo, useState } from 'react';

import { Button, Card, Field, Notice, Stat, inputClass } from './ui';
import { formatAmount, formatBps } from '@/lib/format';
import type { Ledger } from '@managed/kairos/contract/index.js';
import { isPending, type TxPhase } from '@/hooks/useKairos';

const BPS_TOTAL = 10_000n;

/**
 * Protocol-controlled flip between the two treasury reserves.
 *
 * The tax and net figures shown here are computed with the same integer
 * arithmetic the contract uses, so the preview matches what the circuit will
 * actually do — the on-chain result is authoritative, but it should never
 * surprise the user.
 */
export const FlipPanel = ({
  ledger,
  tx,
  canAct,
  onFlip,
}: {
  ledger: Ledger;
  tx: TxPhase;
  canAct: boolean;
  onFlip: (direction: bigint, amount: bigint) => void;
}) => {
  const [direction, setDirection] = useState<0n | 1n>(0n);
  const [amount, setAmount] = useState('1000');
  const [parseError, setParseError] = useState<string | null>(null);

  // Locked for the entire pending window, not just proving: the wallet
  // refuses a second transaction while one is still in flight.
  const busy = isPending(tx);
  const sourceReserve = direction === 0n ? ledger.reserveA : ledger.reserveB;
  const taxRate = direction === 0n ? ledger.taxRateAtoB : ledger.taxRateBtoA;

  const preview = useMemo(() => {
    let parsed: bigint;
    try {
      parsed = BigInt(amount.trim());
    } catch {
      return null;
    }
    if (parsed <= 0n) return null;

    const tax = (parsed * taxRate) / BPS_TOTAL;
    return { amount: parsed, tax, net: parsed - tax };
  }, [amount, taxRate]);

  const handleFlip = () => {
    setParseError(null);

    let parsed: bigint;
    try {
      parsed = BigInt(amount.trim());
    } catch {
      setParseError('Amount must be a whole number.');
      return;
    }

    if (parsed <= 0n) {
      setParseError('Amount must be greater than zero.');
      return;
    }

    if (parsed > sourceReserve) {
      setParseError(
        `The treasury holds ${formatAmount(sourceReserve)} in this reserve; the contract will reject a larger flip.`,
      );
      return;
    }

    onFlip(direction, parsed);
  };

  const fromLabel = direction === 0n ? 'A' : 'B';
  const toLabel = direction === 0n ? 'B' : 'A';
  const colour = direction === 0n ? 'var(--color-side-a)' : 'var(--color-side-b)';

  return (
    <Card
      title="Flip reserves"
      subtitle="Convert treasury reserves between A and B. The directional tax stays in the treasury."
    >
      <div className="flex gap-2">
        {([0n, 1n] as const).map((value) => {
          const active = direction === value;
          const accent = value === 0n ? 'var(--color-side-a)' : 'var(--color-side-b)';
          return (
            <button
              key={value.toString()}
              type="button"
              onClick={() => setDirection(value)}
              disabled={busy}
              aria-pressed={active}
              className="flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              style={{
                borderColor: active ? accent : 'var(--color-border-strong)',
                color: active ? accent : 'var(--color-ink-muted)',
                backgroundColor: active
                  ? `color-mix(in oklab, ${accent} 10%, transparent)`
                  : 'transparent',
              }}
            >
              {value === 0n ? 'A → B' : 'B → A'}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <Field
          label={`Amount (${fromLabel} → ${toLabel})`}
          hint={`Treasury holds ${formatAmount(sourceReserve)} in reserve ${fromLabel}.`}
        >
          <input
            className={inputClass}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="numeric"
            disabled={busy}
            aria-label="Flip amount"
          />
        </Field>
      </div>

      {preview && (
        <dl className="mt-4 grid grid-cols-3 gap-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-4 py-3">
          <Stat label="Amount" value={formatAmount(preview.amount)} />
          <Stat
            label={`Tax @ ${formatBps(taxRate)}`}
            value={formatAmount(preview.tax)}
            hint="to treasury"
          />
          <Stat label={`Net to ${toLabel}`} value={formatAmount(preview.net)} />
        </dl>
      )}

      {parseError && (
        <div className="mt-3">
          <Notice tone="danger">{parseError}</Notice>
        </div>
      )}

      <div className="mt-4">
        <Button variant="primary" onClick={handleFlip} disabled={!canAct || busy}>
          Flip {fromLabel} → {toLabel}
        </Button>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
        Flips are 1:1 in demo units. Only the net amount moves between reserves; the tax is
        retained on the source side as tracked treasury revenue, so total demo value is
        conserved. Moving into {toLabel} is taxed at{' '}
        <span style={{ color: colour }}>{formatBps(taxRate)}</span>.
      </p>
    </Card>
  );
};
