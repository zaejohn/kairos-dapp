'use client';

import { Button, Chip } from './ui';
import { truncateAddress } from '@/lib/midnight/wallet';
import type { NetworkConfig } from '@/lib/midnight/network';
import type { WalletStatus } from '@/hooks/useKairos';
import type { ConnectedWallet } from '@/lib/midnight/wallet';

export const WalletBar = ({
  status,
  wallet,
  config,
  onConnect,
  onDisconnect,
}: {
  status: WalletStatus;
  wallet: ConnectedWallet | null;
  config: NetworkConfig;
  onConnect: () => void;
  onDisconnect: () => void;
}) => (
  <div className="flex flex-wrap items-center justify-end gap-2">
    <Chip tone={config.networkId === 'preprod' ? 'b' : 'neutral'}>{config.label}</Chip>

    {status === 'connected' && wallet ? (
      <>
        <Chip tone="success">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
            aria-hidden
          />
          {/* The connector's own name, so the label stays correct whether the
              user is on 1AM or another compatible wallet. */}
          {wallet.name}
        </Chip>
        <span
          className="tabular hidden text-xs text-[var(--color-ink-muted)] sm:inline"
          title={wallet.unshieldedAddress}
        >
          {truncateAddress(wallet.unshieldedAddress)}
        </span>
        <Button variant="ghost" onClick={onDisconnect}>
          Disconnect
        </Button>
      </>
    ) : (
      <Button variant="primary" onClick={onConnect} disabled={status === 'connecting'}>
        {status === 'connecting' ? 'Connecting…' : 'Connect 1AM'}
      </Button>
    )}
  </div>
);
