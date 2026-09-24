import "@midnight-ntwrk/dapp-connector-api";
import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { parseCoinPublicKeyToHex, parseEncPublicKeyToHex } from "@midnight-ntwrk/midnight-js-utils";
import { AppError } from "@/lib/errors/app-error";
import type { MidnightNetwork } from "@/lib/midnight/config";

export type WalletName = "1AM" | "LACE";

export interface WalletOption {
  id: string;
  name: WalletName;
  api: InitialAPI;
}

export interface WalletConnection {
  name: WalletName;
  shieldedAddress: string;
  networkId: MidnightNetwork;
  coinPublicKey: string;
  encryptionPublicKey: string;
  api: ConnectedAPI;
}

function connectorCode(cause: unknown): string | null {
  if (!cause || typeof cause !== "object" || !("code" in cause)) return null;
  const code = cause.code;
  return typeof code === "string" && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(code) ? code : null;
}

export function walletFailureReason(cause: unknown): string | null {
  if (!cause || typeof cause !== "object") return null;
  const code = connectorCode(cause);
  const detail = "reason" in cause && typeof cause.reason === "string"
    ? cause.reason
    : "message" in cause && typeof cause.message === "string"
      ? cause.message
      : null;
  // Connector reasons are shown only to the owner, but avoid echoing payloads,
  // addresses, URLs, or private material from a wallet's arbitrary error text.
  const safeDetail = detail && detail.length <= 160 && !/[\r\n]/.test(detail) &&
    !/(?:mn_|https?:|seed|mnemonic|password|witness|private key|[a-f0-9]{32})/i.test(detail)
    ? detail
    : null;
  return [code, safeDetail].filter(Boolean).join(": ") || null;
}

function walletName(provider: InitialAPI): WalletName | null {
  const name = provider.name?.trim().toLowerCase();
  const rdns = provider.rdns?.toLowerCase();
  if (rdns === "io.lace.wallet" || name === "lace" || name === "lace wallet") return "LACE";
  if (name === "1am" || name === "1am.xyz" || name === "1am wallet" || rdns === "com.midnight.1am") return "1AM";
  return null;
}

function compatibleOption(id: string, value: unknown): WalletOption | null {
  if (!value || typeof value !== "object") return null;
  const api = value as Partial<InitialAPI>;
  if (typeof api.connect !== "function" || typeof api.apiVersion !== "string" || !/^4\./.test(api.apiVersion)) return null;
  const name = walletName(api as InitialAPI);
  return name ? { id, name, api: api as InitialAPI } : null;
}

export async function detectMidnightWallets(): Promise<WalletOption[]> {
  if (typeof window === "undefined") return [];
  const providers = window.midnight;
  const candidates = Object.entries(providers ?? {}).map(([id, value]) => compatibleOption(id, value)).filter((option): option is WalletOption => option !== null);
  if (!candidates.some((option) => option.name === "LACE") && providers?.mnLace) {
    try {
      const legacy = compatibleOption("mnLace", await providers.mnLace);
      if (legacy) candidates.push(legacy);
    } catch {
      // A legacy injection that does not resolve is not an available wallet.
    }
  }
  const unique = new Map<WalletName, WalletOption>();
  const ambiguous = new Set<WalletName>();
  for (const option of candidates) {
    const previous = unique.get(option.name);
    if (previous && previous.api !== option.api) ambiguous.add(option.name);
    else unique.set(option.name, option);
  }
  return (["1AM", "LACE"] as const).flatMap((name) => {
    const option = unique.get(name);
    return option && !ambiguous.has(name) ? [option] : [];
  });
}

export async function connectMidnightWallet(option: WalletOption, network: MidnightNetwork): Promise<WalletConnection> {
  if (typeof window === "undefined") {
    throw new AppError("WALLET_BROWSER_ONLY", "Wallet connection is available only in the browser.");
  }
  const selected = compatibleOption(option.id, option.api);
  if (!selected || selected.name !== option.name) {
    throw new AppError("WALLET_NOT_FOUND", `${option.name} is no longer available to this tab. Reload and retry.`);
  }

  let stage: "authorization" | "status" | "addresses" = "authorization";
  try {
    // Start the extension request directly from the wallet button's click event.
    const connection = selected.api.connect(network);
    const connectedApi = await connection;
    stage = "status";
    const status = await connectedApi.getConnectionStatus();
    if (status.status !== "connected") {
      throw new AppError("WALLET_NOT_CONNECTED", `${selected.name} did not authorize a connection.`);
    }
    if (status.networkId !== network) {
      throw new AppError("WALLET_WRONG_NETWORK", `${selected.name} connected to ${status.networkId}. Switch to ${network} and retry.`);
    }
    stage = "addresses";
    const addresses = await connectedApi.getShieldedAddresses();
    if (!addresses.shieldedAddress) {
      throw new AppError("WALLET_ADDRESS_MISSING", `${selected.name} connected but did not return a shielded address.`);
    }
    let coinPublicKey: string;
    let encryptionPublicKey: string;
    try {
      coinPublicKey = parseCoinPublicKeyToHex(addresses.shieldedCoinPublicKey, network);
      encryptionPublicKey = parseEncPublicKeyToHex(addresses.shieldedEncryptionPublicKey, network);
    } catch (cause) {
      throw new AppError("WALLET_KEYS_INVALID", `${selected.name} did not provide valid ${network} shielded public keys. Update the wallet and reconnect.`, { cause });
    }
    return { name: selected.name, shieldedAddress: addresses.shieldedAddress, networkId: network, coinPublicKey, encryptionPublicKey, api: connectedApi };
  } catch (cause) {
    if (cause instanceof AppError) throw cause;
    const code = connectorCode(cause);
    if (code === "InvalidRequest" && cause && typeof cause === "object" && "message" in cause && cause.message === "Network ID mismatch") {
      throw new AppError("WALLET_WRONG_NETWORK", `${selected.name} is on a different network. Switch to ${network} and retry.`, { cause });
    }
    if (code === "Rejected" || code === "PermissionRejected") {
      throw new AppError("WALLET_PERMISSION_REJECTED", `${selected.name} did not grant the requested connection or address access. Approve it in the wallet and retry.`, { cause });
    }
    if (stage === "status") {
      throw new AppError("WALLET_STATUS_UNAVAILABLE", `${selected.name} returned a connection, but its Preprod status could not be confirmed. Unlock the wallet and retry.`, { cause });
    }
    if (stage === "addresses") {
      throw new AppError("WALLET_ADDRESS_UNAVAILABLE", `${selected.name} connected, but its shielded address and public keys are unavailable. Finish wallet sync and retry.`, { cause });
    }
    const reason = walletFailureReason(cause);
    throw new AppError("WALLET_CONNECT_FAILED", `${selected.name} did not complete the Preprod connection request${reason ? ` (${reason})` : ""}. Check that the wallet is unlocked and on Preprod, then retry.`, { cause });
  }
}

export function shortenAddress(address: string, edge = 8): string {
  if (address.length <= edge * 2 + 1) return address;
  return `${address.slice(0, edge)}…${address.slice(-edge)}`;
}
