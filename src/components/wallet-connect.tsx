"use client";

import { useState } from "react";
import type { MidnightNetwork } from "@/lib/midnight/config";
import { connectLace, shortenAddress } from "@/lib/midnight/wallet";
import { toSafeErrorMessage } from "@/lib/errors/app-error";

interface WalletConnectProps {
  network: MidnightNetwork;
}

export function WalletConnect({ network }: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    setError(null);

    try {
      const connection = await connectLace(network);
      setAddress(connection.shieldedAddress);
    } catch (cause) {
      setAddress(null);
      setError(toSafeErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function disconnectLocalView() {
    setAddress(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-2xl font-semibold capitalize">{network}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {address ? shortenAddress(address) : "Lace is not connected in this page session."}
        </p>
      </div>

      <button
        type="button"
        onClick={address ? disconnectLocalView : connect}
        disabled={busy}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Connecting…" : address ? "Clear local session" : "Connect Lace"}
      </button>

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
