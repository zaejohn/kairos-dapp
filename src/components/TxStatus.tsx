'use client';

import { Notice } from './ui';
import { truncateAddress } from '@/lib/midnight/wallet';
import type { TxPhase } from '@/hooks/useKairos';

/**
 * Live transaction status.
 *
 * Proving a circuit takes noticeably longer than a typical web request, so the
 * proving phase is shown explicitly rather than as a generic spinner — it tells
 * the user that real zero-knowledge proof generation is in progress.
 */
export const TxStatus = ({ tx }: { tx: TxPhase }) => {
  if (tx.kind === 'idle') return null;

  if (tx.kind === 'proving') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-3">
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--color-accent)]">{tx.label}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
            Generating a zero-knowledge proof on your local proof server…
          </p>
        </div>
      </div>
    );
  }

  if (tx.kind === 'submitted') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-3">
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--color-accent)]">{tx.label}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
            Submitted — waiting for the network to confirm. Further actions are held until it
            lands, because the wallet rejects a second transaction while one is pending.
          </p>
        </div>
      </div>
    );
  }

  if (tx.kind === 'confirmed') {
    return (
      <Notice>
        <span className="font-semibold text-[var(--color-success)]">{tx.label}</span> —
        confirmed. Transaction{' '}
        <span className="tabular" title={tx.txId}>
          {truncateAddress(tx.txId, 12, 8)}
        </span>
      </Notice>
    );
  }

  return (
    <Notice tone="danger">
      <span className="font-semibold">{tx.label} failed.</span> {tx.message}
    </Notice>
  );
};
