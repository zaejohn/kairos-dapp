import { allocationWidths, formatBps } from '@/lib/format';

/**
 * The treasury's target allocation between Token A and Token B.
 *
 * Widths are computed with integer arithmetic and forced to sum to exactly 100,
 * so the bar can never show a seam between the two segments.
 */
export const AllocationBar = ({ a, b }: { a: bigint; b: bigint }) => {
  const widths = allocationWidths(a, b);
  const dominant = a === b ? null : a > b ? 'A' : 'B';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-side-a)]">
            Token A
          </span>
          <span className="tabular text-2xl font-semibold text-[var(--color-side-a)]">
            {formatBps(a)}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tabular text-2xl font-semibold text-[var(--color-side-b)]">
            {formatBps(b)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-side-b)]">
            Token B
          </span>
        </div>
      </div>

      <div
        className="mt-3 flex h-3 w-full overflow-hidden rounded-full border border-[var(--color-border-subtle)]"
        role="img"
        aria-label={`Treasury allocation: Token A ${formatBps(a)}, Token B ${formatBps(b)}`}
      >
        <div
          className="h-full bg-[var(--color-side-a)] transition-[width] duration-500 ease-out"
          style={{ width: `${widths.a}%` }}
        />
        <div
          className="h-full bg-[var(--color-side-b)] transition-[width] duration-500 ease-out"
          style={{ width: `${widths.b}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-[var(--color-ink-muted)]">
        {dominant === null
          ? 'Treasury is balanced.'
          : `Treasury is tilted toward Token ${dominant}.`}{' '}
        Invariant <span className="tabular">A + B = 100%</span> holds on-chain.
      </p>
    </div>
  );
};
