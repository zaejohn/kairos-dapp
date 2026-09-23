'use client';

import { Card, Notice } from './ui';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex gap-3 border-b border-[var(--color-border-subtle)] py-2 last:border-b-0">
    <span className="w-28 shrink-0 text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
      {label}
    </span>
    <span className="min-w-0 text-xs leading-relaxed text-[var(--color-ink)]">{children}</span>
  </div>
);

/**
 * The privacy model, stated in the interface itself.
 *
 * The claim has to match what the contract actually does, so this describes the
 * commit-reveal design and its limits rather than implying permanent secrecy.
 */
export const PrivacyPanel = () => (
  <Card
    title="Privacy model"
    subtitle="What the chain sees, and when it sees it."
    actions={null}
  >
    <div>
      <Row label="Private">
        Your side, your conviction weight, the commitment salt and your secret. These are
        witnesses — they are used to build the proof inside your browser and are never
        transmitted.
      </Row>
      <Row label="Public">
        Market id, lifecycle state, treasury allocation and reserves, tax rates and revenue,
        and your commitment and nullifier as opaque 32-byte hashes.
      </Row>
      <Row label="Disclosed at reveal">
        Your side and weight become public when you reveal, because the tally that decides the
        market has to be computable from public state.
      </Row>
      <Row label="Never disclosed">
        Your secret and the commitment salt. The nullifier folds in the market id, so it is
        single-use per market and unlinkable between markets.
      </Row>
    </div>

    <div className="mt-4 space-y-3">
      <Notice>
        <span className="font-semibold">What an observer can learn:</span> that a wallet
        submitted a commitment to this market, and — after reveals — the side and weight that
        were revealed.
      </Notice>
      <Notice>
        <span className="font-semibold">What an observer cannot learn:</span> which side you
        backed or how much conviction you attached while the market is open.
      </Notice>
      <Notice tone="warning">
        KAIROS is commit-reveal, not permanently secret. Your position is hidden while the
        market is open, and public once you reveal it. Unrevealed positions never enter the
        tally.
      </Notice>
    </div>
  </Card>
);
