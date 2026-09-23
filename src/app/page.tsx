'use client';

import { useMemo } from 'react';

import { FlipPanel } from '@/components/FlipPanel';
import { MarketPanel } from '@/components/MarketPanel';
import { PositionPanel } from '@/components/PositionPanel';
import { TreasuryPanel } from '@/components/TreasuryPanel';
import { TxStatus } from '@/components/TxStatus';
import { WalletBar } from '@/components/WalletBar';
import { Button, Card, Chip, Notice } from '@/components/ui';
import { PrivacyPanel } from '@/components/PrivacyPanel';
import { useKairos } from '@/hooks/useKairos';
import { getNetworkConfig, DEFAULT_NETWORK_ID } from '@/lib/midnight/network';
import { truncateAddress } from '@/lib/midnight/wallet';

export default function Page() {
  const kairos = useKairos();
  const config = useMemo(() => getNetworkConfig(DEFAULT_NETWORK_ID), []);

  const canAct = kairos.walletStatus === 'connected' && kairos.ledger !== null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Masthead */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            KAIROS
            <span className="ml-3 align-middle text-xs font-normal uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
              Confidential Treasury
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
            Private conviction. Collective signal. Autonomous treasury rebalancing.
          </p>
        </div>
        <WalletBar
          status={kairos.walletStatus}
          wallet={kairos.wallet}
          config={config}
          onConnect={() => void kairos.connect()}
          onDisconnect={kairos.disconnect}
        />
      </header>

      {/* Connection and environment notices */}
      <div className="mt-6 space-y-3">
        {kairos.walletError && <Notice tone="danger">{kairos.walletError}</Notice>}
        {kairos.ledgerError && (
          <Notice tone="danger">Could not read contract state: {kairos.ledgerError}</Notice>
        )}

        {kairos.walletStatus !== 'connected' && (
          <Notice>
            Connect Lace to read the treasury and act on the current market. Proving runs
            against your local proof server at{' '}
            <span className="tabular">{config.proofServerUri}</span>.
          </Notice>
        )}

        {kairos.walletStatus === 'connected' && !kairos.isDeployed && (
          <Card
            title="No contract configured"
            subtitle="This build has no KAIROS contract address set."
          >
            <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
              Set <span className="tabular">NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS</span> to a
              deployed address, or deploy a fresh instance from this wallet. Deploying costs
              testnet tNIGHT and takes a moment while the proof is generated.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => void kairos.deploy()}
                disabled={kairos.tx.kind === 'proving'}
              >
                Deploy KAIROS contract
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Transaction status sits above the panels it relates to. */}
      <div className="mt-6">
        <TxStatus tx={kairos.tx} />
      </div>

      {/* Main grid */}
      {kairos.ledger ? (
        <main className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <MarketPanel
              ledger={kairos.ledger}
              tx={kairos.tx}
              canAct={canAct}
              onClose={() => void kairos.closeMarket()}
              onSettle={() => void kairos.settleMarket()}
              onFinalize={() => void kairos.finalizeMarket()}
              onNext={() => void kairos.startNextMarket()}
            />
            <TreasuryPanel ledger={kairos.ledger} />
            <FlipPanel
              ledger={kairos.ledger}
              tx={kairos.tx}
              canAct={canAct}
              onFlip={(direction, amount) => void kairos.flip(direction, amount)}
            />
          </div>

          <div className="space-y-6">
            <PositionPanel
              ledger={kairos.ledger}
              tx={kairos.tx}
              canAct={canAct}
              myPosition={kairos.myPosition}
              onSubmit={(side, weight) => void kairos.submitPosition(side, weight)}
              onReveal={() => void kairos.revealPosition()}
            />
            <PrivacyPanel />
          </div>
        </main>
      ) : (
        kairos.walletStatus === 'connected' &&
        kairos.isDeployed && (
          <div className="mt-6">
            <Notice>
              Waiting for contract state from the indexer. This can take a moment on a fresh
              deployment.
            </Notice>
          </div>
        )
      )}

      {/* Footer */}
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-6 text-[11px] text-[var(--color-ink-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <Chip>{config.label}</Chip>
          {kairos.contractAddress && (
            <span className="tabular" title={kairos.contractAddress}>
              Contract {truncateAddress(kairos.contractAddress, 16, 8)}
            </span>
          )}
        </div>
        <span>
          Treasury reserves are labelled demo units and represent no real asset.
        </span>
      </footer>
    </div>
  );
}
