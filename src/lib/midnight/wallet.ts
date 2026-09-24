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

  const providers = window.midnight;
  const laceProviders = Object.values(providers ?? {}).filter((provider) => provider?.rdns === "io.lace.wallet");
  const compatibleLace = laceProviders.filter((provider) => /^4\./.test(provider.apiVersion));
  if (compatibleLace.length > 1) {
    throw new AppError("WALLET_AMBIGUOUS", "Multiple compatible Midnight Lace providers were detected. Disable duplicate extensions and retry.");
  }
  const injected = compatibleLace[0] ?? laceProviders[0] ?? providers?.mnLace;
  const wallet: InitialAPI | undefined = injected ? await injected : undefined;

  if (!wallet) {
    throw new AppError("WALLET_NOT_FOUND", "Midnight Lace is not available to this tab. Enable extension access to this site, reload the page, then retry.");
  }
  if (wallet.rdns && wallet.rdns !== "io.lace.wallet") {
    throw new AppError("WALLET_NOT_FOUND", "Midnight Lace is not available to this tab. Enable extension access to this site, reload the page, then retry.");
  }
  if (wallet.apiVersion && !/^4\./.test(wallet.apiVersion)) {
    throw new AppError("WALLET_UNSUPPORTED_VERSION", `Midnight Lace provides connector API ${wallet.apiVersion}; Kairos requires version 4. Update Lace, then reload the page.`);
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
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "InvalidRequest"
      && "message" in cause && cause.message === "Network ID mismatch") {
      throw new AppError("WALLET_WRONG_NETWORK", `Lace is on a different network. Switch Lace to ${network} and retry.`, { cause });
    }

    throw new AppError("WALLET_CONNECT_FAILED", "Lace wallet connection failed.", { cause });
  }
}

export function shortenAddress(address: string, edge = 8): string {
  if (address.length <= edge * 2 + 1) return address;
  return `${address.slice(0, edge)}…${address.slice(-edge)}`;
}
