'use client';

import { AllocationBar } from './AllocationBar';
import { Card, Notice, Stat } from './ui';
import { formatAmount, formatBps } from '@/lib/format';
import type { Ledger } from '@managed/kairos/contract/index.js';

/**
 * Treasury state: the target allocation, the demo-asset reserves backing it,
 * and the asymmetric tax configuration plus the revenue it has produced.
 */
export const TreasuryPanel = ({ ledger }: { ledger: Ledger }) => {
  const taxRevenue = ledger.taxCollectedA + ledger.taxCollectedB;

  return (
    <Card
      title="Treasury"
      subtitle="Protocol-owned allocation between the two quote-side assets."
    >
      <AllocationBar a={ledger.allocA} b={ledger.allocB} />

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
        <Stat
          label="Reserve A"
          value={formatAmount(ledger.reserveA)}
          accent="a"
          hint="demo units"
        />
        <Stat
          label="Reserve B"
          value={formatAmount(ledger.reserveB)}
          accent="b"
          hint="demo units"
        />
        <Stat
          label="Tax A → B"
          value={formatBps(ledger.taxRateAtoB)}
          hint="charged moving into B"
        />
        <Stat
          label="Tax B → A"
          value={formatBps(ledger.taxRateBtoA)}
          hint="charged moving into A"
        />
        <Stat label="Tax revenue in A" value={formatAmount(ledger.taxCollectedA)} accent="a" />
        <Stat label="Tax revenue in B" value={formatAmount(ledger.taxCollectedB)} accent="b" />
      </dl>

      <div className="mt-5">
        {taxRevenue === 0n ? (
          <Notice>
            No flip tax collected yet. Flipping between A and B returns a directional tax to
            the treasury.
          </Notice>
        ) : (
          <Notice>
            The treasury has retained <span className="tabular">{formatAmount(taxRevenue)}</span>{' '}
            demo units of flip tax. The asymmetry is deliberate: moving into B costs more than
            moving into A.
          </Notice>
        )}
      </div>
    </Card>
  );
};
