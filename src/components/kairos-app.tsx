"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { WalletConnection, WalletOption } from "@/lib/midnight/wallet";
import {
  connectMidnightWallet,
  detectMidnightWallets,
  shortenAddress,
  walletFailureReason,
} from "@/lib/midnight/wallet";
import {
  createOpening,
  isContractAddress,
  openingSaltBytes,
  parseOpening,
  parseResolutionBundle,
  type SavedOpening,
} from "@/lib/market/openings";
import type {
  MarketSnapshot,
  PublicTreasuryAction,
  PublicTxReceipt,
} from "@/lib/midnight/market-client";
import type {
  TransactionProgress,
  TransactionStage,
} from "@/lib/midnight/transaction-progress";
import { AppError } from "@/lib/errors/app-error";
import {
  parseTradeAmount,
  tradeFee,
  type QuoteSide,
  type TradeDirection,
} from "@/lib/market/trading";
import { allocationMatchesTarget } from "@/lib/market/allocation";

const stations = [
  { label: "Rewards", target: "rewards", className: "hotspot-rewards" },
  { label: "Settings", target: "settings", className: "hotspot-settings" },
  { label: "Trading Engine", target: "trading", className: "hotspot-trading" },
  { label: "Wallet", target: "wallet", className: "hotspot-wallet" },
  { label: "Treasury", target: "scrap", className: "hotspot-scrap" },
] as const;

type Station = (typeof stations)[number]["target"];
type PositionPreview = Pick<
  SavedOpening,
  "contractAddress" | "round" | "side"
> & { receipt?: PublicTxReceipt };

const transactionStageText: Record<TransactionStage, string> = {
  preparing: "Preparing wallet keys and contract providers…",
  proving: "Generating a proof with the proof server on this device…",
  balancing: "Balancing in the wallet; approve if prompted…",
  submitting: "Submitting through the wallet…",
  finalizing: "Waiting for Preprod finalization…",
};

const transactionFailureText: Record<TransactionStage, string> = {
  preparing:
    "Wallet or provider setup failed. Check the local password and wallet connection, then retry.",
  proving:
    "Local proving failed. Check the Kairos proof server, browser Local Network Access permission, and circuit inputs.",
  balancing:
    "The wallet could not balance or authorize the transaction. Check DUST and wallet prompts before retrying.",
  submitting:
    "The wallet reported a submission error. Check wallet history and public state before retrying.",
  finalizing:
    "Preprod finalization could not be confirmed. Check the submitted transaction ID before retrying.",
};

function downloadOpening(opening: SavedOpening) {
  const blob = new Blob([JSON.stringify(opening, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kairos-opening-round-${opening.round}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function shortError(error: unknown, fallback: string) {
  if (error instanceof AppError) return error.message;
  if (
    error instanceof Error &&
    /^(Opening|Every opening|Exactly eight|A valid Preprod|Enter a whole number|Trade amount)/.test(
      error.message,
    )
  )
    return error.message;
  const reason = walletFailureReason(error);
  if (reason) return `${fallback} Wallet response: ${reason}.`;
  return fallback;
}

function phaseLabel(snapshot: MarketSnapshot | null, nowSeconds: number) {
  if (!snapshot) return "Unavailable";
  if (snapshot.phase === 2n) return "Resolved";
  if (nowSeconds >= Number(snapshot.roundCloseAt) + 86_400)
    return "Expiry available";
  if (nowSeconds >= Number(snapshot.roundCloseAt))
    return snapshot.phase === 1n ? "Resolving" : "Closed";
  if (snapshot.phase === 1n) return "Full · awaiting close";
  if (snapshot.phase === 0n) return "Open";
  return "Unavailable";
}

function treasuryActionLabel(action: PublicTreasuryAction) {
  if (action.kind === 1n) return "Expiry · target retained";
  if (action.kind === 2n) return "Reserve restoration";
  return `Resolution · ${action.winner === 0n ? "Quote A" : action.winner === 1n ? "Quote B" : "tie"}`;
}

export function KairosApp({
  initialContractAddress,
}: {
  initialContractAddress: string;
}) {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [active, setActive] = useState<Station | null>(null);
  const [walletStatus, setWalletStatus] = useState<
    "idle" | "connecting" | "connected" | "failed"
  >("idle");
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [walletDetecting, setWalletDetecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [additionalAddresses, setAdditionalAddresses] = useState<{
    unshielded: string;
    dust: string;
  } | null>(null);
  const [addressStatus, setAddressStatus] = useState<"idle" | "loading" | "failed">("idle");
  const [walletBalances, setWalletBalances] = useState<Record<
    string,
    bigint
  > | null>(null);
  const [walletBalanceStatus, setWalletBalanceStatus] = useState<
    "idle" | "loading" | "ready" | "failed"
  >("idle");
  const [contractAddress, setContractAddress] = useState(
    initialContractAddress,
  );
  const [password, setPassword] = useState("");
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [side, setSide] = useState<0 | 1>(0);
  const [tradeSide, setTradeSide] = useState<QuoteSide>(0);
  const [tradeDirection, setTradeDirection] = useState<TradeDirection>("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [prepared, setPrepared] = useState<SavedOpening | null>(null);
  const [sessionPositions, setSessionPositions] = useState<PositionPreview[]>(
    [],
  );
  const [importedPosition, setImportedPosition] =
    useState<PositionPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bundle, setBundle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [transactionProgress, setTransactionProgress] =
    useState<TransactionProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PublicTxReceipt | null>(null);
  const [proofStatus, setProofStatus] = useState<
    "unknown" | "ready" | "unavailable"
  >("unknown");
  const [nowSeconds, setNowSeconds] = useState(0);
  const transactionProgressRef = useRef<TransactionProgress | null>(null);
  const activeAddress = useRef(contractAddress);
  const loadGeneration = useRef(0);
  const walletBalanceGeneration = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active && !dialog.open) dialog.showModal();
    if (!active && dialog.open) dialog.close();
  }, [active]);

  useEffect(() => {
    if (active !== "wallet" || wallet || walletStatus === "connecting") return;
    let cancelled = false;
    const detect = () => {
      void detectMidnightWallets()
        .then((options) => {
          if (!cancelled) setWalletOptions(options);
        })
        .catch(() => {
          if (!cancelled) setWalletOptions([]);
        })
        .finally(() => {
          if (!cancelled) setWalletDetecting(false);
        });
    };
    detect();
    const timer = window.setInterval(detect, 500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, wallet, walletStatus]);

  useEffect(() => {
    const update = () => setNowSeconds(Math.floor(Date.now() / 1000));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function reportTransactionProgress(progress: TransactionProgress | null) {
    transactionProgressRef.current = progress;
    setTransactionProgress(progress);
  }

  async function getClient() {
    if (!wallet)
      throw new AppError("WALLET_REQUIRED", "Connect a Midnight wallet first.");
    reportTransactionProgress({ stage: "preparing" });
    const { createMarketClient } = await import("@/lib/midnight/market-client");
    return createMarketClient(
      wallet,
      password,
      reportTransactionProgress,
    );
  }

  function selectWallet(option: WalletOption) {
    if (walletStatus === "connecting") return;
    // Start the extension request while this button click still has user activation.
    const connection = connectMidnightWallet(option, "preprod");
    setWalletError(null);
    setWalletMessage(null);
    setWalletStatus("connecting");
    setBusy("connecting");
    void connection
      .then((connected) => {
        setWallet(connected);
        setAdditionalAddresses(null);
        setAddressStatus("idle");
        setWalletStatus("connected");
        walletBalanceGeneration.current++;
        setWalletBalances(null);
        setWalletBalanceStatus("idle");
        setActive(null);
      })
      .catch((cause: unknown) => {
        setWalletStatus("failed");
        setWalletError(
          shortError(
            cause,
            `${option.name} connection failed. Retry in the wallet.`,
          ),
        );
        setActive("wallet");
      })
      .finally(() => setBusy(null));
  }

  function openStation(station: Station) {
    if (station === "wallet" && !wallet) {
      setWalletOptions([]);
      setWalletDetecting(true);
      setWalletError(null);
    }
    setActive(station);
  }

  async function copyWalletAddress() {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.shieldedAddress);
      setWalletMessage("Shielded address copied.");
      setWalletError(null);
    } catch {
      setWalletError("Could not copy the address. Select and copy it below.");
    }
  }

  function revealAdditionalAddresses() {
    if (!wallet || addressStatus === "loading") return;
    const generation = walletBalanceGeneration.current;
    setAddressStatus("loading");
    setWalletError(null);
    void Promise.all([
          wallet.api.getUnshieldedAddress(),
          wallet.api.getDustAddress(),
        ])
      .then(([unshielded, dust]) => {
        if (generation !== walletBalanceGeneration.current) return;
        if (!unshielded.unshieldedAddress || !dust.dustAddress) {
          throw new AppError("WALLET_ADDRESS_MISSING", "The wallet did not return both additional addresses.");
        }
        setAdditionalAddresses({ unshielded: unshielded.unshieldedAddress, dust: dust.dustAddress });
        setAddressStatus("idle");
      })
      .catch((cause: unknown) => {
        if (generation !== walletBalanceGeneration.current) return;
        setAddressStatus("failed");
        setWalletError(shortError(cause, "The wallet did not provide unshielded and DUST addresses. Check wallet permissions and retry."));
      });
  }

  async function refreshWalletBalances() {
    if (!wallet) return;
    const generation = ++walletBalanceGeneration.current;
    setWalletBalanceStatus("loading");
    setWalletError(null);
    try {
      const balances = await wallet.api.getUnshieldedBalances();
      if (
        Object.values(balances).some(
          (amount) => typeof amount !== "bigint" || amount < 0n,
        )
      ) {
        throw new Error("Invalid wallet balance response");
      }
      if (generation === walletBalanceGeneration.current) {
        setWalletBalances(balances);
        setWalletBalanceStatus("ready");
      }
    } catch {
      if (generation === walletBalanceGeneration.current) {
        setWalletBalances(null);
        setWalletBalanceStatus("failed");
      }
    }
  }

  function disconnectWallet() {
    setWallet(null);
    setAdditionalAddresses(null);
    setAddressStatus("idle");
    setWalletStatus("idle");
    walletBalanceGeneration.current++;
    setWalletOptions([]);
    setWalletDetecting(true);
    setWalletBalances(null);
    setWalletBalanceStatus("idle");
    setPassword("");
    setSide(0);
    setTradeSide(0);
    setTradeDirection("buy");
    setTradeAmount("");
    setPrepared(null);
    setSessionPositions([]);
    setImportedPosition(null);
    setImportError(null);
    setSaved(false);
    setBundle("");
    setReceipt(null);
    setError(null);
    setMessage(null);
    reportTransactionProgress(null);
    setWalletMessage(
      "Kairos session disconnected. Revoke site access in your wallet if needed.",
    );
    setWalletError(null);
  }

  async function run(
    label: string,
    work: () => Promise<void>,
    failure: string,
  ) {
    setBusy(label);
    reportTransactionProgress(null);
    setError(null);
    setMessage(null);
    try {
      await work();
    } catch (cause) {
      const progress = transactionProgressRef.current;
      const fallback = progress
        ? transactionFailureText[progress.stage]
        : failure;
      const submittedId = progress?.submittedTxId;
      setError(
        `${shortError(cause, fallback)}${submittedId ? ` Submitted transaction ID: ${submittedId}.` : ""}`,
      );
    } finally {
      reportTransactionProgress(null);
      setBusy(null);
    }
  }

  async function refresh(address = contractAddress) {
    if (!isContractAddress(address)) {
      setSnapshot(null);
      throw new Error("A valid Preprod contract address is required.");
    }
    const generation = ++loadGeneration.current;
    const { readPublicMarket } = await import("@/lib/midnight/market-client");
    const next = await readPublicMarket(address);
    if (
      generation !== loadGeneration.current ||
      activeAddress.current !== address
    )
      return;
    setSnapshot(next);
    setPrepared((current) =>
      current?.round === Number(next.round) && next.phase === 0n
        ? current
        : null,
    );
    setSaved(false);
  }

  async function refreshAfterFinalized(address: string) {
    reportTransactionProgress(null);
    try {
      await refresh(address);
    } catch {
      setMessage(
        "Transaction finalized, but the indexer has not returned the latest state. Load public state again shortly.",
      );
    }
  }

  useEffect(() => {
    if (isContractAddress(initialContractAddress)) {
      const generation = ++loadGeneration.current;
      void import("@/lib/midnight/market-client")
        .then(({ readPublicMarket }) =>
          readPublicMarket(initialContractAddress),
        )
        .then((next) => {
          if (
            generation === loadGeneration.current &&
            activeAddress.current === initialContractAddress
          )
            setSnapshot(next);
        })
        .catch(() => {
          if (
            generation === loadGeneration.current &&
            activeAddress.current === initialContractAddress
          ) {
            setSnapshot(null);
            setError("Could not load the configured Preprod contract. Check the address and Preprod indexer, then retry in Settings.");
          }
        });
    }
  }, [initialContractAddress]);

  function prepare() {
    if (
      !snapshot ||
      snapshot.phase !== 0n ||
      nowSeconds >= Number(snapshot.roundCloseAt) ||
      !isContractAddress(contractAddress)
    ) {
      setError("Load an open Preprod round before preparing a position.");
      return;
    }
    setPrepared(createOpening(contractAddress, Number(snapshot.round), side));
    setSaved(false);
    setError(null);
    setMessage(
      "Download the opening and keep it private. The resolver will need it later.",
    );
  }

  async function previewOpeningFile(file: File | undefined) {
    if (!file) return;
    setImportError(null);
    setImportedPosition(null);
    if (file.size > 16_384) {
      setImportError(
        "Opening file is too large. Select a Kairos opening JSON file.",
      );
      return;
    }
    try {
      const opening = parseOpening(JSON.parse(await file.text()) as unknown);
      setImportedPosition({
        contractAddress: opening.contractAddress,
        round: opening.round,
        side: opening.side,
      });
    } catch {
      setImportError(
        "The selected file is not a valid Kairos opening JSON file.",
      );
    }
  }

  const tradeGross =
    /^[1-9][0-9]*$/.test(tradeAmount) &&
    BigInt(tradeAmount) >= 100n &&
    BigInt(tradeAmount) <= (1n << 64n) - 1n
      ? BigInt(tradeAmount)
      : null;
  const tradeBps =
    snapshot &&
    (tradeDirection === "buy"
      ? tradeSide === 0
        ? snapshot.buyFeeA
        : snapshot.buyFeeB
      : tradeSide === 0
        ? snapshot.sellFeeA
        : snapshot.sellFeeB);
  const displayedFee =
    tradeGross !== null && tradeBps !== null && tradeBps !== undefined
      ? tradeFee(tradeGross, tradeBps)
      : null;
  const allocationApplied =
    snapshot !== null &&
    allocationMatchesTarget(
      snapshot.reserveA,
      snapshot.reserveB,
      snapshot.targetA,
    );
  const canCommit =
    snapshot?.phase === 0n && nowSeconds < Number(snapshot.roundCloseAt);
  const canResolve =
    snapshot?.phase === 1n &&
    nowSeconds >= Number(snapshot.roundCloseAt) &&
    nowSeconds < Number(snapshot.roundCloseAt) + 86_400;
  const canExpire =
    snapshot !== null &&
    snapshot.phase !== 2n &&
    nowSeconds >= Number(snapshot.roundCloseAt) + 86_400;
  const accountedNight = snapshot
    ? snapshot.reserveA + snapshot.reserveB + snapshot.feePool
    : null;
  const tradeNet =
    tradeGross !== null && displayedFee !== null
      ? tradeGross - displayedFee
      : null;

  return (
    <main>
      <header className="app-header">
        <div className="app-brand">
          <strong>KAIROS</strong>
          <span>PRIVATE SIGNAL · PUBLIC DIRECTION</span>
        </div>
        <div className="app-header-actions">
          <span className="network-pill">MIDNIGHT PREPROD</span>
          <button
            type="button"
            className="header-wallet"
            onClick={() => openStation("wallet")}
          >
            {wallet
              ? `${wallet.name} · shielded ${shortenAddress(wallet.shieldedAddress, 5)}`
              : walletStatus === "connecting"
                ? "Connecting wallet…"
                : "Connect wallet"}
          </button>
        </div>
      </header>
      <section className="app-intro" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">THE WEEKLY MARKET</p>
          <h1 id="app-title">
            Conviction in private.
            <br />
            <em>Direction in public.</em>
          </h1>
        </div>
        <p>
          Choose a quote side privately, then follow the public result as Kairos
          adjusts contract-held NIGHT reserves and trading fees. The resolver
          sees submitted openings; trades are public.
        </p>
      </section>
      <div className="home-artwork">
        <Image
          src="/reference/home-image.png"
          alt="Kairos workshop with Rewards, Settings, Trading Engine, Wallet, and Scrap Fund stations"
          width={1832}
          height={858}
          priority
          unoptimized
          sizes="100vw"
        />
        {stations.map((station) => (
          <button
            key={station.target}
            type="button"
            className={`hotspot ${station.className}`}
            aria-label={`Open ${station.label}`}
            onClick={() => openStation(station.target)}
          />
        ))}
      </div>
      <nav className="station-navigation" aria-label="Kairos stations">
        {stations.map((station, index) => (
          <button
            key={station.target}
            type="button"
            onClick={() => openStation(station.target)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {station.label}
            <b aria-hidden="true">↗</b>
          </button>
        ))}
      </nav>
      <section className="mechanism-strip" aria-label="How Kairos works">
        <span>01 / Private position</span>
        <span>02 / Weekly result</span>
        <span>03 / Treasury allocation</span>
        <span>04 / Contract trading</span>
      </section>
      <footer>
        <span>KAIROS / MIDNIGHT PREPROD</span>
        <span>Private signal · Public policy · Contract-custodied trading</span>
      </footer>

      <dialog
        ref={dialogRef}
        className={`station-dialog${active === "wallet" ? " wallet-dialog" : ""}`}
        aria-label={
          stations.find((station) => station.target === active)?.label
        }
        onClose={() => setActive(null)}
      >
        <div className="dialog-heading">
          <strong>
            {stations.find((station) => station.target === active)?.label}
          </strong>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setActive(null)}
          >
            ×
          </button>
        </div>
        {active === "trading" && (
          <section className="status-strip" aria-label="Market status">
            <div>
              <span>ROUND</span>
              <strong>
                {snapshot ? snapshot.round.toString().padStart(2, "0") : "—"}
              </strong>
            </div>
            <div>
              <span>MARKET</span>
              <strong>{phaseLabel(snapshot, nowSeconds)}</strong>
            </div>
            <div>
              <span>COMMITMENTS</span>
              <strong>{snapshot ? `${snapshot.positions}/8` : "—"}</strong>
            </div>
            <div>
              <span>ROUND CLOSES</span>
              <strong>
                {snapshot
                  ? new Date(
                      Number(snapshot.roundCloseAt) * 1000,
                    ).toLocaleString()
                  : "—"}
              </strong>
            </div>
            <div>
              <span>TARGET A / B</span>
              <strong>
                {snapshot ? `${snapshot.targetA}% / ${snapshot.targetB}%` : "—"}
              </strong>
            </div>
          </section>
        )}

        {active &&
          active !== "wallet" &&
          (error || message || receipt || transactionProgress) && (
            <div className="notification" role={error ? "alert" : "status"}>
              {error && <p className="error-text">{error}</p>}
              {message && <p>{message}</p>}
              {transactionProgress && (
                <p>{transactionStageText[transactionProgress.stage]}</p>
              )}
              {transactionProgress?.submittedTxId && (
                <p>
                  Submitted transaction ID:{" "}
                  <code>{transactionProgress.submittedTxId}</code>. Check
                  Preprod before retrying if finalization stays pending.
                </p>
              )}
              {receipt && (
                <p>
                  Last finalized transaction in block {receipt.blockHeight}:{" "}
                  <code>{receipt.txId}</code>
                </p>
              )}
            </div>
          )}

        <div className="dialog-content">
          {active === "trading" && (
            <section id="market" className="panel feature-panel">
              <div className="panel-heading">
                <span className="section-index">01 / MARKET</span>
                <span className="panel-state">
                  {phaseLabel(snapshot, nowSeconds)}
                </span>
              </div>
              <h2>Commit your market view</h2>
              <p>
                The side and salt enter a proof locally. The chain records a
                commitment hash, its position in the round, and transaction
                timing. This signal has no token deposit or payout.
              </p>
              <div
                className="side-select"
                role="group"
                aria-label="Quote-side choice"
              >
                <button
                  type="button"
                  className={side === 0 ? "selected" : ""}
                  onClick={() => {
                    setSide(0);
                    setPrepared(null);
                  }}
                >
                  Quote A
                </button>
                <button
                  type="button"
                  className={side === 1 ? "selected" : ""}
                  onClick={() => {
                    setSide(1);
                    setPrepared(null);
                  }}
                >
                  Quote B
                </button>
              </div>
              <div className="action-row">
                <button
                  type="button"
                  className="button-primary"
                  onClick={prepare}
                  disabled={Boolean(busy) || !canCommit}
                >
                  Prepare private opening
                </button>
                {prepared && (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => downloadOpening(prepared)}
                  >
                    Download opening
                  </button>
                )}
              </div>
              {prepared && (
                <div className="opening-step">
                  <label>
                    <input
                      type="checkbox"
                      checked={saved}
                      onChange={(event) => setSaved(event.target.checked)}
                    />{" "}
                    I saved my opening. Losing it prevents this position from
                    joining resolution.
                  </label>
                  <button
                    type="button"
                    className="button-primary"
                    disabled={!saved || Boolean(busy) || !canCommit}
                    onClick={() =>
                      void run(
                        "proving",
                        async () => {
                          const client = await getClient();
                          const result = await client.commit(
                            contractAddress,
                            BigInt(prepared.round),
                            BigInt(prepared.side),
                            openingSaltBytes(prepared),
                          );
                          setReceipt(result);
                          setSessionPositions((current) =>
                            [
                              {
                                contractAddress: prepared.contractAddress,
                                round: prepared.round,
                                side: prepared.side,
                                receipt: result,
                              },
                              ...current,
                            ].slice(0, 8),
                          );
                          setPrepared(null);
                          setSaved(false);
                          await refreshAfterFinalized(contractAddress);
                        },
                        "Position submission failed. Check the wallet, local proof server, DUST, and the round; keep your opening for retry.",
                      )
                    }
                  >
                    {busy === "proving"
                      ? "Proving and finalizing…"
                      : "Submit commitment"}
                  </button>
                </div>
              )}
              <p className="fine-print">
                Eight commitments fill a round. One trusted resolver needs all
                eight opening files; it and its proof server see their contents.
              </p>
              <details className="position-vault">
                <summary>My position files and session receipts</summary>
                <p>
                  Only this browser session remembers finalized submissions.
                  Your downloaded opening file is the backup needed for
                  resolution; Kairos never uploads it from this control.
                </p>
                <label className="field-label" htmlFor="opening-preview">
                  Preview a saved opening locally
                </label>
                <input
                  id="opening-preview"
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    void previewOpeningFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {importError && (
                  <p className="error-text" role="alert">
                    {importError}
                  </p>
                )}
                {importedPosition && (
                  <div className="position-row">
                    <span>Imported file · Unverified on-chain</span>
                    <strong>
                      Round {importedPosition.round} · Quote{" "}
                      {importedPosition.side === 0 ? "A" : "B"}
                    </strong>
                    <small>
                      Contract{" "}
                      {shortenAddress(importedPosition.contractAddress, 8)}
                    </small>
                  </div>
                )}
                {sessionPositions.length === 0 && (
                  <p>
                    No finalized position has been recorded in this browser
                    session.
                  </p>
                )}
                {sessionPositions.map((position) => (
                  <div className="position-row" key={position.receipt?.txId}>
                    <span>
                      Finalized in block {position.receipt?.blockHeight}
                    </span>
                    <strong>
                      Round {position.round} · Quote{" "}
                      {position.side === 0 ? "A" : "B"}
                    </strong>
                    <small>
                      Transaction{" "}
                      {shortenAddress(position.receipt?.txId ?? "", 8)}
                    </small>
                  </div>
                ))}
                <p className="fine-print">
                  A local file is not proof that its commitment reached Preprod.
                  The selected side is shown only in this browser, not in Kairos
                  public ledger state.
                </p>
              </details>
            </section>
          )}

          {active === "wallet" && (
            <div className="wallet-options">
              {wallet ? (
                <div className="wallet-account">
                  <span className="eyebrow">CONNECTED TO PREPROD</span>
                  <strong>{wallet.name}</strong>
                  <label className="field-label" htmlFor="wallet-address">
                    Your shielded address
                  </label>
                  <textarea
                    id="wallet-address"
                    readOnly
                    value={wallet.shieldedAddress}
                    rows={3}
                  />
                  <p className="fine-print">Kairos uses the shielded public keys for contract calls. The wallet balances and signs the deployment transaction.</p>
                  {additionalAddresses ? (
                    <>
                      <label className="field-label" htmlFor="wallet-unshielded-address">Your unshielded address</label>
                      <textarea id="wallet-unshielded-address" readOnly value={additionalAddresses.unshielded} rows={3} />
                      <p className="fine-print">Use this address for Preprod NIGHT funding. Kairos also uses it as the recipient for public quote token trades.</p>
                      <label className="field-label" htmlFor="wallet-dust-address">Your DUST address</label>
                      <textarea id="wallet-dust-address" readOnly value={additionalAddresses.dust} rows={3} />
                      <p className="fine-print">The wallet manages DUST when paying network fees for contract transactions.</p>
                    </>
                  ) : (
                    <button type="button" disabled={addressStatus === "loading"} onClick={revealAdditionalAddresses}>
                      {addressStatus === "loading" ? "Requesting wallet addresses…" : "Show unshielded and DUST addresses"}
                    </button>
                  )}
                  <div className="action-row">
                    <button
                      type="button"
                      onClick={() => void copyWalletAddress()}
                    >
                      Copy shielded address
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={disconnectWallet}
                    >
                      Disconnect in Kairos
                    </button>
                  </div>
                  <p className="fine-print">
                    This ends the local Kairos session. Manage the site
                    permission in your wallet.
                  </p>
                </div>
              ) : (
                <>
                  <p>Choose a detected Midnight wallet on Preprod.</p>
                  {walletOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectWallet(option)}
                      disabled={walletStatus === "connecting"}
                    >
                      {option.name}
                    </button>
                  ))}
                  {walletStatus === "connecting" && (
                    <span role="status">Waiting for wallet approval… 1AM may open in the browser side panel.</span>
                  )}
                  {walletDetecting &&
                    walletOptions.length === 0 &&
                    walletStatus !== "connecting" && (
                      <span role="status">Detecting wallets…</span>
                    )}
                  {!walletDetecting &&
                    walletOptions.length === 0 &&
                    walletStatus !== "connecting" && (
                      <span role="status">No compatible wallets detected.</span>
                    )}
                </>
              )}
              {walletMessage && <span role="status">{walletMessage}</span>}
              {walletError && <span role="alert">{walletError}</span>}
            </div>
          )}

          {active === "trading" && (
            <section id="trading" className="panel trading-panel">
              <div className="panel-heading">
                <span className="section-index">03 / TRADING</span>
                <span className="panel-state">
                  {snapshot?.economyIssued ? "Issued" : "Awaiting genesis"}
                </span>
              </div>
              <h2>Quote the conviction</h2>
              <p>
                Buy Quote A or B with NIGHT, or sell a quote back for NIGHT when
                its side reserve can cover redemption. Rates are one atomic unit
                to one before the displayed fee. KAI incentives are paid from
                fixed inventory while it lasts.
              </p>
              <div className="fee-grid" aria-label="Current trading fees">
                <div>
                  <span>QUOTE A</span>
                  <strong>
                    {snapshot
                      ? `${Number(snapshot.buyFeeA) / 100}% buy · ${Number(snapshot.sellFeeA) / 100}% sell`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>QUOTE B</span>
                  <strong>
                    {snapshot
                      ? `${Number(snapshot.buyFeeB) / 100}% buy · ${Number(snapshot.sellFeeB) / 100}% sell`
                      : "—"}
                  </strong>
                </div>
              </div>
              <div
                className="side-select"
                role="group"
                aria-label="Trade direction"
              >
                <button
                  type="button"
                  className={tradeDirection === "buy" ? "selected" : ""}
                  onClick={() => setTradeDirection("buy")}
                >
                  Buy quote
                </button>
                <button
                  type="button"
                  className={tradeDirection === "sell" ? "selected" : ""}
                  onClick={() => setTradeDirection("sell")}
                >
                  Sell quote
                </button>
              </div>
              <div
                className="side-select"
                role="group"
                aria-label="Trade quote side"
              >
                <button
                  type="button"
                  className={tradeSide === 0 ? "selected" : ""}
                  onClick={() => setTradeSide(0)}
                >
                  Quote A
                </button>
                <button
                  type="button"
                  className={tradeSide === 1 ? "selected" : ""}
                  onClick={() => setTradeSide(1)}
                >
                  Quote B
                </button>
              </div>
              <label className="field-label" htmlFor="trade-amount">
                Gross amount in atomic units
              </label>
              <input
                id="trade-amount"
                inputMode="numeric"
                value={tradeAmount}
                onChange={(event) => setTradeAmount(event.target.value)}
                placeholder="10000"
              />
              <div className="trade-preview" aria-live="polite">
                <div>
                  <span>Pay</span>
                  <strong>
                    {tradeGross?.toString() ?? "—"}{" "}
                    {tradeDirection === "buy"
                      ? "NIGHT"
                      : `QUOTE ${tradeSide === 0 ? "A" : "B"}`}
                  </strong>
                </div>
                <div>
                  <span>Protocol fee</span>
                  <strong>
                    {displayedFee === null
                      ? "Enter a valid amount"
                      : `${displayedFee} units (${tradeBps} bps)`}
                  </strong>
                </div>
                <div>
                  <span>Receive</span>
                  <strong>
                    {tradeNet?.toString() ?? "—"}{" "}
                    {tradeDirection === "buy"
                      ? `QUOTE ${tradeSide === 0 ? "A" : "B"}`
                      : "NIGHT"}
                  </strong>
                </div>
              </div>
              <div className="action-row">
                {!snapshot?.economyIssued && (
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={Boolean(busy) || !snapshot || !wallet}
                    onClick={() =>
                      void run(
                        "issuing",
                        async () => {
                          const client = await getClient();
                          setReceipt(
                            await client.initializeEconomy(contractAddress),
                          );
                          await refreshAfterFinalized(contractAddress);
                        },
                        "Token genesis did not finalize. Check the wallet, proof server, and this contract.",
                      )
                    }
                  >
                    {busy === "issuing"
                      ? "Issuing…"
                      : "Initialize fixed token economy"}
                  </button>
                )}
                <button
                  type="button"
                  className="button-primary"
                  disabled={
                    Boolean(busy) ||
                    !snapshot?.economyIssued ||
                    !wallet ||
                    tradeGross === null
                  }
                  onClick={() =>
                    void run(
                      "trading",
                      async () => {
                        const gross = parseTradeAmount(tradeAmount);
                        const client = await getClient();
                        setReceipt(
                          await client.trade(
                            contractAddress,
                            tradeSide,
                            tradeDirection,
                            gross,
                          ),
                        );
                        setTradeAmount("");
                        await refreshAfterFinalized(contractAddress);
                      },
                      "Trade did not finalize. Check wallet balances, quote inventory, side reserve, and proof server.",
                    )
                  }
                >
                  {busy === "trading"
                    ? "Proving and finalizing…"
                    : `${tradeDirection === "buy" ? "Buy" : "Sell"} Quote ${tradeSide === 0 ? "A" : "B"}`}
                </button>
              </div>
              <p className="fine-print">
                Trade side, amount, fee, and unshielded recipient are public.
                Wallet-to-wallet transfers bypass these fees. KAI has no
                redemption promise.
              </p>
            </section>
          )}

          {active === "scrap" && (
            <section id="treasury" className="panel treasury-panel">
              <div className="panel-heading">
                <span className="section-index">04 / TREASURY</span>
                <span className="panel-state">
                  {snapshot?.phase === 2n
                    ? allocationApplied
                      ? "Target applied"
                      : "Trade changed split"
                    : "Internal allocation"}
                </span>
              </div>
              <h2>One result, one target</h2>
              <p>
                Resolution sets the winning quote side and atomically applies
                its 70/30 target to internal NIGHT redemption limits. Expiry
                reapplies the existing target. Later trades may change the
                split; anyone can restore it. No assets move to an external
                exchange.
              </p>
              <div className="metric-grid">
                <div>
                  <span>ACCOUNTED NIGHT</span>
                  <strong>{accountedNight?.toString() ?? "—"}</strong>
                </div>
                <div>
                  <span>QUOTE A RESERVE</span>
                  <strong>{snapshot?.reserveA.toString() ?? "—"}</strong>
                </div>
                <div>
                  <span>QUOTE B RESERVE</span>
                  <strong>{snapshot?.reserveB.toString() ?? "—"}</strong>
                </div>
                <div>
                  <span>FEE POOL</span>
                  <strong>{snapshot?.feePool.toString() ?? "—"}</strong>
                </div>
              </div>
              <div className="allocation" aria-label="Current treasury target">
                <div style={{ width: `${snapshot?.targetA ?? 0}%` }} />
                <div style={{ width: `${snapshot?.targetB ?? 0}%` }} />
              </div>
              <div className="allocation-labels">
                <span>QUOTE A · {snapshot ? `${snapshot.targetA}%` : "—"}</span>
                <span>QUOTE B · {snapshot ? `${snapshot.targetB}%` : "—"}</span>
              </div>
              <p>
                Round {snapshot?.round.toString() ?? "—"} · Last result:{" "}
                {snapshot
                  ? snapshot.phase !== 2n
                    ? "Awaiting resolution"
                    : snapshot.winner === 0n
                      ? "Quote A"
                      : snapshot.winner === 1n
                        ? "Quote B"
                        : "No winner"
                  : "—"}
                . Reserves and fees are public accounting values in atomic NIGHT
                units.
              </p>
              <div className="action-row">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={
                    Boolean(busy) ||
                    snapshot?.phase !== 2n ||
                    allocationApplied ||
                    !wallet
                  }
                  onClick={() =>
                    void run(
                      "rebalancing",
                      async () => {
                        const client = await getClient();
                        setReceipt(await client.rebalance(contractAddress));
                        await refreshAfterFinalized(contractAddress);
                      },
                      "Rebalance did not finalize. Refresh public state and retry.",
                    )
                  }
                >
                  {busy === "rebalancing"
                    ? "Restoring…"
                    : "Restore target allocation"}
                </button>
              </div>
              <p className="fine-print">
                Quote redemption is conditional on its side reserve. Allocation
                changes accounting limits; the contract retains custody of
                NIGHT.
              </p>
              <div className="treasury-history">
                <div className="panel-heading">
                  <h3>Public treasury actions</h3>
                  <span className="panel-state">
                    {snapshot?.treasuryActionCount.toString() ?? "—"} total
                  </span>
                </div>
                {!snapshot && (
                  <p>
                    Load a verified Preprod contract in Settings to read its
                    public history.
                  </p>
                )}
                {snapshot && snapshot.recentTreasuryActions.length === 0 && (
                  <p>No treasury action has been recorded by this contract.</p>
                )}
                {snapshot?.recentTreasuryActions.map((action) => (
                  <div
                    className="treasury-history-item"
                    key={action.index.toString()}
                  >
                    <div>
                      <span>
                        EVENT {action.index + 1n} · ROUND {action.round}
                      </span>
                      <strong>{treasuryActionLabel(action)}</strong>
                    </div>
                    <div>
                      <span>TARGET</span>
                      <strong>
                        {action.targetA}% / {action.targetB}%
                      </strong>
                    </div>
                    <div>
                      <span>RESERVES A / B</span>
                      <strong>
                        {action.reserveA} / {action.reserveB} atomic NIGHT
                      </strong>
                    </div>
                    <div>
                      <span>FEE POOL</span>
                      <strong>{action.feePool} atomic NIGHT</strong>
                    </div>
                  </div>
                ))}
                {snapshot && snapshot.treasuryActionCount > 10n && (
                  <p className="fine-print">
                    Showing the ten most recent on-chain actions.
                  </p>
                )}
              </div>
              <div className="session-receipt">
                <strong>Latest transaction in this browser session</strong>
                <p>
                  {receipt ? (
                    <>
                      Finalized in block {receipt.blockHeight}:{" "}
                      <code>{receipt.txId}</code>
                    </>
                  ) : (
                    "No finalized Kairos transaction in this session."
                  )}
                </p>
                <p className="fine-print">
                  Treasury records are public contract state. They do not
                  contain transaction IDs or execution timestamps.
                </p>
              </div>
            </section>
          )}

          {active === "rewards" && (
            <section id="rewards" className="panel rewards-panel">
              <div className="panel-heading">
                <span className="section-index">05 / REWARDS</span>
                <span className="panel-state">Trade incentive</span>
              </div>
              <h2>KAI follows activity</h2>
              <p>
                The contract mints one million KAI units into its own custody
                once. Eligible contract-mediated trades send the fee amount in
                KAI to the same unshielded recipient while inventory remains. No
                market-signal reward or claim route exists.
              </p>
              <div className="metric-grid">
                <div>
                  <span>KAI DISTRIBUTED</span>
                  <strong>{snapshot?.kaiDistributed.toString() ?? "—"}</strong>
                </div>
                <div>
                  <span>KAI INVENTORY REMAINING</span>
                  <strong>
                    {snapshot?.economyIssued
                      ? (1_000_000n - snapshot.kaiDistributed).toString()
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>WEEKLY ROUND</span>
                  <strong>{snapshot?.round.toString() ?? "—"}</strong>
                </div>
                <div>
                  <span>INCENTIVE ROUTE</span>
                  <strong>Eligible trades</strong>
                </div>
              </div>
              <p className="fine-print">
                Staking, unstaking, and claiming are not contract routes in this
                version. KAI is issued directly during eligible trades; there is
                no pending reward balance.
              </p>
              {snapshot?.economyIssued && (
                <details className="token-colors">
                  <summary>View public token colors</summary>
                  <p>
                    Quote A <code>{snapshot.quoteAColor}</code>
                  </p>
                  <p>
                    Quote B <code>{snapshot.quoteBColor}</code>
                  </p>
                  <p>
                    KAI <code>{snapshot.kaiColor}</code>
                  </p>
                </details>
              )}
            </section>
          )}

          {active === "settings" && (
            <section id="settings" className="panel settings-panel">
              <div className="panel-heading">
                <span className="section-index">06 / SETTINGS</span>
                <span className="panel-state">Diagnostics</span>
              </div>
              <h2>Network and resolver</h2>
              <div className="settings-wallet">
                <span className="field-label">Wallet session</span>
                <strong>
                  {wallet
                    ? `${wallet.name} · shielded ${shortenAddress(wallet.shieldedAddress, 8)}`
                    : "Not connected"}
                </strong>
                <div className="action-row">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => openStation("wallet")}
                  >
                    {wallet ? "View address and disconnect" : "Connect wallet"}
                  </button>
                </div>
              </div>
              <div className="settings-wallet">
                <span className="field-label">Unshielded wallet balances</span>
                <p>
                  Read directly from your connected wallet. Token labels appear
                  only when they match the loaded Kairos contract colors.
                </p>
                <div className="action-row">
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={!wallet || walletBalanceStatus === "loading"}
                    onClick={() => void refreshWalletBalances()}
                  >
                    {walletBalanceStatus === "loading"
                      ? "Reading wallet…"
                      : "Refresh wallet balances"}
                  </button>
                </div>
                {walletBalanceStatus === "failed" && (
                  <p role="alert" className="error-text">
                    The wallet could not return unshielded balances. Check its
                    connection and retry.
                  </p>
                )}
                {walletBalanceStatus === "ready" && walletBalances && (
                  <div className="wallet-balance-list">
                    {Object.entries(walletBalances).length === 0 ? (
                      <p>
                        No unshielded token balances returned by this wallet.
                      </p>
                    ) : (
                      Object.entries(walletBalances)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([type, amount]) => (
                          <div key={type}>
                            <span>
                              {snapshot?.economyIssued &&
                              type.toLowerCase() ===
                                snapshot.quoteAColor.toLowerCase()
                                ? "Quote A"
                                : snapshot?.economyIssued &&
                                    type.toLowerCase() ===
                                      snapshot.quoteBColor.toLowerCase()
                                  ? "Quote B"
                                  : snapshot?.economyIssued &&
                                      type.toLowerCase() ===
                                        snapshot.kaiColor.toLowerCase()
                                    ? "KAI"
                                    : `Token ${shortenAddress(type, 6)}`}
                            </span>
                            <strong>{amount.toString()}</strong>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
              <label className="field-label" htmlFor="contract-address">
                Preprod contract address
              </label>
              <input
                id="contract-address"
                value={contractAddress}
                onChange={(event) => {
                  const next = event.target.value.trim();
                  activeAddress.current = next;
                  loadGeneration.current++;
                  setContractAddress(next);
                  setSnapshot(null);
                  setPrepared(null);
                  setSaved(false);
                  setBundle("");
                }}
                placeholder="64-character contract address"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="action-row">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={
                    Boolean(busy) || !isContractAddress(contractAddress)
                  }
                  onClick={() =>
                    void run(
                      "refreshing",
                      async () => {
                        await refresh();
                        setMessage("Public Preprod state loaded.");
                      },
                      "Could not read this contract from the Preprod indexer.",
                    )
                  }
                >
                  {busy === "refreshing" ? "Loading…" : "Load public state"}
                </button>
              </div>
              <label className="field-label" htmlFor="local-password">
                Local storage password
              </label>
              <input
                id="local-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="16+ characters, 3 character classes"
                autoComplete="new-password"
              />
              <p className="fine-print">
                Used in this browser to encrypt Midnight signing keys. It is
                never sent to Kairos. Keep it safe; changing it may make
                existing local keys inaccessible.
              </p>
              <div className="action-row">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={Boolean(busy) || !wallet}
                  onClick={() =>
                    void run(
                      "deploying",
                      async () => {
                        const client = await getClient();
                        const deployed = await client.deploy();
                        activeAddress.current = deployed.contractAddress;
                        loadGeneration.current++;
                        setContractAddress(deployed.contractAddress);
                        setReceipt(deployed.receipt);
                        setMessage(
                          "Kairos contract finalized on Preprod. Save its public address.",
                        );
                        await refreshAfterFinalized(deployed.contractAddress);
                      },
                      "Deployment did not finalize. Check the local proof server, browser Local Network Access permission, wallet, and DUST.",
                    )
                  }
                >
                  {busy === "deploying"
                    ? "Deploying and finalizing…"
                    : "Deploy new Preprod contract"}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    void run(
                      "checking",
                      async () => {
                        setProofStatus("unknown");
                        try {
                          const [health, version] = await Promise.all([
                            fetch("http://127.0.0.1:6301/health"),
                            fetch("http://127.0.0.1:6301/version"),
                          ]);
                          if (!health.ok || !version.ok || !(await version.text()).includes("8.1.0"))
                            throw new Error("proof server unavailable or wrong version");
                          setProofStatus("ready");
                          setMessage("The proof server on this device responded.");
                        } catch (cause) {
                          setProofStatus("unavailable");
                          throw cause;
                        }
                      },
                      "Cannot confirm proof server 8.1.0 at 127.0.0.1:6301. Start it and allow browser Local Network Access for this site.",
                    )
                  }
                >
                  Check local proof server
                </button>
              </div>
              <p className="fine-print">
                Proof server on this device: {proofStatus}. Transactions need a
                local server at 127.0.0.1:6301, including when this site is
                hosted. Your browser may ask to allow Local Network Access.
                Private openings stay on this device when using that server.
              </p>
            </section>
          )}

          {active === "trading" && (
            <section className="panel resolver-panel">
              <div className="panel-heading">
                <span className="section-index">07 / RESOLUTION</span>
                <span className="panel-state">Trusted resolver</span>
              </div>
              <h2>Resolve the weekly round</h2>
              <p>
                After the public close time, paste eight opening files in
                commitment order. The resolver has one day to prove the winner
                and sees every side. If openings are missing, anyone can expire
                the round after that window; the allocation target stays
                unchanged.
              </p>
              <label className="field-label" htmlFor="opening-bundle">
                Private opening bundle
              </label>
              <textarea
                id="opening-bundle"
                value={bundle}
                onChange={(event) => setBundle(event.target.value)}
                placeholder="[ { version, contractAddress, round, side, salt }, ... ]"
                spellCheck={false}
              />
              <div className="action-row">
                <button
                  type="button"
                  className="button-primary"
                  disabled={Boolean(busy) || !canResolve || !bundle}
                  onClick={() =>
                    void run(
                      "resolving",
                      async () => {
                        if (!snapshot) throw new Error("no round");
                        const openings = parseResolutionBundle(
                          bundle,
                          contractAddress,
                          snapshot.round,
                        );
                        const client = await getClient();
                        const result = await client.resolve(
                          contractAddress,
                          openings,
                        );
                        setReceipt(result);
                        setBundle("");
                        await refreshAfterFinalized(contractAddress);
                      },
                      "Resolution failed. Check all eight openings, the wallet, and local proving; no result was confirmed.",
                    )
                  }
                >
                  {busy === "resolving"
                    ? "Proving and finalizing…"
                    : "Prove result"}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={
                    Boolean(busy) ||
                    snapshot?.phase !== 2n ||
                    !allocationApplied ||
                    !wallet
                  }
                  onClick={() =>
                    void run(
                      "advancing",
                      async () => {
                        const client = await getClient();
                        setReceipt(
                          await client.startNextRound(contractAddress),
                        );
                        await refreshAfterFinalized(contractAddress);
                      },
                      "The next round did not finalize.",
                    )
                  }
                >
                  {busy === "advancing" ? "Starting…" : "Start next round"}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={Boolean(busy) || !canExpire || !wallet}
                  onClick={() =>
                    void run(
                      "expiring",
                      async () => {
                        const client = await getClient();
                        setReceipt(await client.expire(contractAddress));
                        await refreshAfterFinalized(contractAddress);
                      },
                      "Expiry failed. The one-day resolution window may still be open; load public state and retry.",
                    )
                  }
                >
                  {busy === "expiring" ? "Expiring…" : "Expire missed round"}
                </button>
              </div>
              {snapshot?.phase === 2n && !allocationApplied && (
                <p className="fine-print">
                  Restore the target allocation in Treasury after intervening
                  trades before starting the next round.
                </p>
              )}
            </section>
          )}
        </div>
      </dialog>
    </main>
  );
}
