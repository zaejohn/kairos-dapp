import "@midnight-ntwrk/dapp-connector-api";
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { AppError } from "@/lib/errors/app-error";
import type { MidnightNetwork } from "@/lib/midnight/config";

export interface LaceConnection {
  shieldedAddress: string;
  api: ConnectedAPI;
}

export async function connectLace(network: MidnightNetwork): Promise<LaceConnection> {
  if (typeof window === "undefined") {
    throw new AppError("WALLET_BROWSER_ONLY", "Wallet connection is available only in the browser.");
  }

  const injected = window.midnight?.mnLace;
  const wallet: InitialAPI | undefined = injected ? await injected : undefined;

  if (!wallet) {
    throw new AppError("WALLET_NOT_FOUND", "Lace wallet was not detected. Install or enable Lace, then retry.");
  }

  try {
    const connectedApi = await wallet.connect(network);
    const connectionStatus = await connectedApi.getConnectionStatus();

    if (connectionStatus.status !== "connected") {
      throw new AppError("WALLET_NOT_CONNECTED", "Lace did not establish a wallet connection.");
    }
    if (connectionStatus.networkId !== network) {
      throw new AppError("WALLET_WRONG_NETWORK", `Lace connected to ${connectionStatus.networkId}. Switch Lace to ${network} and retry.`);
    }

    const addresses = await connectedApi.getShieldedAddresses();

    if (!addresses.shieldedAddress) {
      throw new AppError("WALLET_ADDRESS_MISSING", "Lace connected but did not return a shielded address.");
    }

    return { shieldedAddress: addresses.shieldedAddress, api: connectedApi };
  } catch (cause) {
    if (cause instanceof AppError) {
      throw cause;
    }

    throw new AppError("WALLET_CONNECT_FAILED", "Lace wallet connection failed.", { cause });
  }
}

export function shortenAddress(address: string, edge = 8): string {
  if (address.length <= edge * 2 + 1) return address;
  return `${address.slice(0, edge)}…${address.slice(-edge)}`;
}
