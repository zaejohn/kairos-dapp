"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { LaceConnection } from "@/lib/midnight/wallet";
import { connectLace, shortenAddress } from "@/lib/midnight/wallet";
import { createOpening, isContractAddress, openingSaltBytes, parseResolutionBundle, type SavedOpening } from "@/lib/market/openings";
import type { MarketSnapshot, PublicTxReceipt } from "@/lib/midnight/market-client";
import type { TransactionProgress, TransactionStage } from "@/lib/midnight/transaction-progress";
import { AppError } from "@/lib/errors/app-error";
import { parseTradeAmount, tradeFee, type QuoteSide, type TradeDirection } from "@/lib/market/trading";
import { allocationMatchesTarget } from "@/lib/market/allocation";

const stations = [
  { label: "Rewards", target: "rewards", className: "station-rewards" },
  { label: "Settings", target: "settings", className: "station-settings" },
  { label: "Market", target: "market", className: "station-market" },
  { label: "Wallet", target: "wallet", className: "station-wallet" },
  { label: "Treasury", target: "treasury", className: "station-treasury" },
] as const;

const transactionStageText: Record<TransactionStage, string> = {
  preparing: "Preparing wallet keys and contract providers…",
  proving: "Generating a proof with the local server…",
  balancing: "Balancing in Lace; approve if prompted…",
  submitting: "Submitting through Lace…",
  finalizing: "Waiting for Preprod finalization…",
};

const transactionFailureText: Record<TransactionStage, string> = {
  preparing: "Wallet or provider setup failed. Check the local password and Lace connection, then retry.",
  proving: "Local proving failed. Check the Kairos proof server, generated artifacts, and circuit inputs.",
  balancing: "Lace could not balance or authorize the transaction. Check DUST and wallet prompts before retrying.",
  submitting: "Lace reported a submission error. Check wallet history and public state before retrying.",
  finalizing: "Preprod finalization could not be confirmed. Check the submitted transaction ID before retrying.",
};

function downloadOpening(opening: SavedOpening) {
  const blob = new Blob([JSON.stringify(opening, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kairos-opening-round-${opening.round}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function shortError(error: unknown, fallback: string) {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && /^(Opening|Every opening|Exactly eight|A valid Preprod|Enter a whole number|Trade amount)/.test(error.message)) return error.message;
  return fallback;
}

function phaseLabel(snapshot: MarketSnapshot | null, nowSeconds: number) {
  if (!snapshot) return "Unavailable";
  if (snapshot.phase === 2n) return "Resolved";
  if (nowSeconds >= Number(snapshot.roundCloseAt) + 86_400) return "Expiry available";
  if (nowSeconds >= Number(snapshot.roundCloseAt)) return snapshot.phase === 1n ? "Resolving" : "Closed";
  if (snapshot.phase === 1n) return "Full · awaiting close";
  if (snapshot.phase === 0n) return "Open";
  return "Unavailable";
}

export function KairosApp({ initialContractAddress }: { initialContractAddress: string }) {
  const [wallet, setWallet] = useState<LaceConnection | null>(null);
  const [contractAddress, setContractAddress] = useState(initialContractAddress);
  const [password, setPassword] = useState("");
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [side, setSide] = useState<0 | 1>(0);
  const [tradeSide, setTradeSide] = useState<QuoteSide>(0);
  const [tradeDirection, setTradeDirection] = useState<TradeDirection>("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [prepared, setPrepared] = useState<SavedOpening | null>(null);
  const [saved, setSaved] = useState(false);
  const [bundle, setBundle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [transactionProgress, setTransactionProgress] = useState<TransactionProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PublicTxReceipt | null>(null);
  const [proofStatus, setProofStatus] = useState<"unknown" | "ready" | "unavailable">("unknown");
  const [nowSeconds, setNowSeconds] = useState(0);
  const transactionProgressRef = useRef<TransactionProgress | null>(null);
  const activeAddress = useRef(contractAddress);
  const loadGeneration = useRef(0);

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
    if (!wallet) throw new AppError("WALLET_REQUIRED", "Connect Lace first.");
    reportTransactionProgress({ stage: "preparing" });
    const { createMarketClient } = await import("@/lib/midnight/market-client");
    return createMarketClient(wallet.api, wallet.shieldedAddress, password, reportTransactionProgress);
  }

  async function run(label: string, work: () => Promise<void>, failure: string) {
    setBusy(label);
    reportTransactionProgress(null);
    setError(null);
    setMessage(null);
    try {
      await work();
    } catch (cause) {
      const progress = transactionProgressRef.current;
      const fallback = progress ? transactionFailureText[progress.stage] : failure;
      const submittedId = progress?.submittedTxId;
      setError(`${shortError(cause, fallback)}${submittedId ? ` Submitted transaction ID: ${submittedId}.` : ""}`);
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
    if (generation !== loadGeneration.current || activeAddress.current !== address) return;
    setSnapshot(next);
    setPrepared((current) => current?.round === Number(next.round) && next.phase === 0n ? current : null);
    setSaved(false);
  }

  async function refreshAfterFinalized(address: string) {
    reportTransactionProgress(null);
    try {
      await refresh(address);
    } catch {
      setMessage("Transaction finalized, but the indexer has not returned the latest state. Load public state again shortly.");
    }
  }

  useEffect(() => {
    if (isContractAddress(initialContractAddress)) {
      const generation = ++loadGeneration.current;
      void import("@/lib/midnight/market-client")
        .then(({ readPublicMarket }) => readPublicMarket(initialContractAddress))
        .then((next) => {
          if (generation === loadGeneration.current && activeAddress.current === initialContractAddress) setSnapshot(next);
        })
        .catch(() => {
          if (generation === loadGeneration.current && activeAddress.current === initialContractAddress) setSnapshot(null);
        });
    }
  }, [initialContractAddress]);

  function prepare() {
    if (!snapshot || snapshot.phase !== 0n || nowSeconds >= Number(snapshot.roundCloseAt) || !isContractAddress(contractAddress)) {
      setError("Load an open Preprod round before preparing a position.");
      return;
    }
    setPrepared(createOpening(contractAddress, Number(snapshot.round), side));
    setSaved(false);
    setError(null);
    setMessage("Download the opening and keep it private. The resolver will need it later.");
  }

  const tradeGross = /^[1-9][0-9]*$/.test(tradeAmount) && BigInt(tradeAmount) >= 100n && BigInt(tradeAmount) <= (1n << 64n) - 1n ? BigInt(tradeAmount) : null;
  const tradeBps = snapshot && (tradeDirection === "buy" ? (tradeSide === 0 ? snapshot.buyFeeA : snapshot.buyFeeB) : (tradeSide === 0 ? snapshot.sellFeeA : snapshot.sellFeeB));
  const displayedFee = tradeGross !== null && tradeBps !== null && tradeBps !== undefined ? tradeFee(tradeGross, tradeBps) : null;
  const allocationApplied = snapshot !== null && allocationMatchesTarget(snapshot.reserveA, snapshot.reserveB, snapshot.targetA);
  const canCommit = snapshot?.phase === 0n && nowSeconds < Number(snapshot.roundCloseAt);
  const canResolve = snapshot?.phase === 1n && nowSeconds >= Number(snapshot.roundCloseAt) && nowSeconds < Number(snapshot.roundCloseAt) + 86_400;
  const canExpire = snapshot !== null && snapshot.phase !== 2n && nowSeconds >= Number(snapshot.roundCloseAt) + 86_400;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kairos home">KAIROS<span> / PREPROD</span></a>
        <div className="topbar-right"><span className="network-pill">MIDNIGHT PREPROD</span><a href="#wallet">{wallet ? shortenAddress(wallet.shieldedAddress, 5) : "Connect wallet"}</a></div>
      </header>

      <section id="top" className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">THE NEXT ALLOCATION BEGINS IN PRIVATE</p>
          <h1>Market conviction.<br /><em>Public direction.</em></h1>
          <p>Kairos is a bounded private signal market for a future self-rebalancing treasury. Eight salted positions produce one public winner and an auditable allocation target.</p>
          <a className="primary-link" href="#market">Enter the market <span aria-hidden>↗</span></a>
        </div>
        <div className="scene" aria-label="Navigate Kairos stations">
          <Image src="/reference/kairos-workshop.png" alt="Illustrated workshop with interactive market, rewards, wallet, treasury, and settings stations" fill priority sizes="(max-width: 900px) 100vw, 1200px" />
          <div className="scene-shade" />
          {stations.map((station) => (
            <a key={station.target} className={`station ${station.className}`} href={`#${station.target}`} aria-label={`Open ${station.label}`}>
              <span>{station.label}</span><span aria-hidden>↗</span>
            </a>
          ))}
        </div>
        <nav className="mobile-stations" aria-label="Product stations">
          {stations.map((station) => <a key={station.target} href={`#${station.target}`}>{station.label}<span aria-hidden>↗</span></a>)}
        </nav>
      </section>

      <section className="status-strip" aria-label="Market status">
        <div><span>ROUND</span><strong>{snapshot ? snapshot.round.toString().padStart(2, "0") : "—"}</strong></div>
        <div><span>MARKET</span><strong>{phaseLabel(snapshot, nowSeconds)}</strong></div>
        <div><span>COMMITMENTS</span><strong>{snapshot ? `${snapshot.positions}/8` : "—"}</strong></div>
        <div><span>ROUND CLOSES</span><strong>{snapshot ? new Date(Number(snapshot.roundCloseAt) * 1000).toLocaleString() : "—"}</strong></div>
        <div><span>TARGET A / B</span><strong>{snapshot ? `${snapshot.targetA}% / ${snapshot.targetB}%` : "—"}</strong></div>
      </section>

      {(error || message || receipt || transactionProgress) && <div className="notification" role={error ? "alert" : "status"}>
        {error && <p className="error-text">{error}</p>}
        {message && <p>{message}</p>}
        {transactionProgress && <p>{transactionStageText[transactionProgress.stage]}</p>}
        {transactionProgress?.submittedTxId && <p>Submitted transaction ID: <code>{transactionProgress.submittedTxId}</code>. Check Preprod before retrying if finalization stays pending.</p>}
        {receipt && <p>Last finalized transaction in block {receipt.blockHeight}: <code>{receipt.txId}</code></p>}
      </div>}

      <div className="content-grid">
        <section id="market" className="panel feature-panel">
          <div className="panel-heading"><span className="section-index">01 / MARKET</span><span className="panel-state">{phaseLabel(snapshot, nowSeconds)}</span></div>
          <h2>Commit your market view</h2>
          <p>The side and salt enter a proof locally. The chain records a commitment hash, its position in the round, and transaction timing. This signal has no token deposit or payout.</p>
          <div className="side-select" role="group" aria-label="Quote-side choice">
            <button type="button" className={side === 0 ? "selected" : ""} onClick={() => { setSide(0); setPrepared(null); }}>Quote A</button>
            <button type="button" className={side === 1 ? "selected" : ""} onClick={() => { setSide(1); setPrepared(null); }}>Quote B</button>
          </div>
          <div className="action-row">
            <button type="button" className="button-primary" onClick={prepare} disabled={Boolean(busy) || !canCommit}>Prepare private opening</button>
            {prepared && <button type="button" className="button-secondary" onClick={() => downloadOpening(prepared)}>Download opening</button>}
          </div>
          {prepared && <div className="opening-step">
            <label><input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} /> I saved my opening. Losing it prevents this position from joining resolution.</label>
            <button type="button" className="button-primary" disabled={!saved || Boolean(busy) || !canCommit} onClick={() => void run("proving", async () => {
              const client = await getClient();
              const result = await client.commit(contractAddress, BigInt(prepared.round), BigInt(prepared.side), openingSaltBytes(prepared));
              setReceipt(result);
              setPrepared(null);
              setSaved(false);
              await refreshAfterFinalized(contractAddress);
            }, "Position submission failed. Check Lace, local proof server, DUST, and the round; keep your opening for retry.")}>{busy === "proving" ? "Proving and finalizing…" : "Submit commitment"}</button>
          </div>}
          <p className="fine-print">Eight commitments fill a round. One trusted resolver needs all eight opening files; it and its proof server see their contents.</p>
          <a href="#trading">Explore contract-mediated trading ↗</a>
        </section>

        <section id="wallet" className="panel wallet-panel">
          <div className="panel-heading"><span className="section-index">02 / WALLET</span><span className="panel-state">{wallet ? "Connected" : "Disconnected"}</span></div>
          <h2>Lace on Preprod</h2>
          <p>{wallet ? shortenAddress(wallet.shieldedAddress) : "Connect Lace to submit a proof or deploy a contract. Public market state can be read without a wallet."}</p>
          <div className="action-row"><button type="button" className="button-secondary" disabled={Boolean(busy)} onClick={() => {
            if (wallet) {
              setWallet(null);
              setPassword("");
              setSide(0);
              setTradeSide(0);
              setTradeDirection("buy");
              setTradeAmount("");
              setPrepared(null);
              setSaved(false);
              setBundle("");
              setReceipt(null);
              setError(null);
              setMessage("Local session and private inputs cleared. Revoke site access in Lace if needed.");
              return;
            }
            void run("connecting", async () => { setWallet(await connectLace("preprod")); setMessage("Lace connected to Midnight Preprod."); }, "Could not connect Lace. Check installation, permission, and selected network.");
          }}>{busy === "connecting" ? "Connecting…" : wallet ? "Clear local session" : "Connect Lace"}</button></div>
        </section>

        <section id="trading" className="panel trading-panel">
          <div className="panel-heading"><span className="section-index">03 / TRADING</span><span className="panel-state">{snapshot?.economyIssued ? "Issued" : "Awaiting genesis"}</span></div>
          <h2>Quote the conviction</h2>
          <p>Buy Quote A or B with NIGHT, or sell a quote back for NIGHT when its side reserve can cover redemption. Rates are one atomic unit to one before the displayed fee. KAI incentives are paid from fixed inventory while it lasts.</p>
          <div className="side-select" role="group" aria-label="Trade direction">
            <button type="button" className={tradeDirection === "buy" ? "selected" : ""} onClick={() => setTradeDirection("buy")}>Buy quote</button>
            <button type="button" className={tradeDirection === "sell" ? "selected" : ""} onClick={() => setTradeDirection("sell")}>Sell quote</button>
          </div>
          <div className="side-select" role="group" aria-label="Trade quote side">
            <button type="button" className={tradeSide === 0 ? "selected" : ""} onClick={() => setTradeSide(0)}>Quote A</button>
            <button type="button" className={tradeSide === 1 ? "selected" : ""} onClick={() => setTradeSide(1)}>Quote B</button>
          </div>
          <label className="field-label" htmlFor="trade-amount">Gross amount in atomic units</label>
          <input id="trade-amount" inputMode="numeric" value={tradeAmount} onChange={(event) => setTradeAmount(event.target.value)} placeholder="10000" />
          <p>Fee: {displayedFee === null ? "enter a valid amount" : `${displayedFee} units (${tradeBps} bps)`}. {displayedFee !== null && tradeGross !== null ? `Net ${tradeDirection === "buy" ? "quote" : "NIGHT"}: ${tradeGross - displayedFee} units.` : ""}</p>
          <div className="action-row">
            {!snapshot?.economyIssued && <button type="button" className="button-secondary" disabled={Boolean(busy) || !snapshot || !wallet} onClick={() => void run("issuing", async () => {
              const client = await getClient();
              setReceipt(await client.initializeEconomy(contractAddress));
              await refreshAfterFinalized(contractAddress);
            }, "Token genesis did not finalize. Check Lace, proof server, and this contract.")}>{busy === "issuing" ? "Issuing…" : "Initialize fixed token economy"}</button>}
            <button type="button" className="button-primary" disabled={Boolean(busy) || !snapshot?.economyIssued || !wallet || tradeGross === null} onClick={() => void run("trading", async () => {
              const gross = parseTradeAmount(tradeAmount);
              const client = await getClient();
              setReceipt(await client.trade(contractAddress, tradeSide, tradeDirection, gross));
              setTradeAmount("");
              await refreshAfterFinalized(contractAddress);
            }, "Trade did not finalize. Check Lace balances, quote inventory, side reserve, and proof server.")}>{busy === "trading" ? "Proving and finalizing…" : `${tradeDirection === "buy" ? "Buy" : "Sell"} Quote ${tradeSide === 0 ? "A" : "B"}`}</button>
          </div>
          <p className="fine-print">Trade side, amount, fee, and unshielded recipient are public. Wallet-to-wallet transfers bypass these fees. KAI has no redemption promise.</p>
        </section>

        <section id="treasury" className="panel treasury-panel">
          <div className="panel-heading"><span className="section-index">04 / TREASURY</span><span className="panel-state">{snapshot?.phase === 2n ? allocationApplied ? "Target applied" : "Trade changed split" : "Internal allocation"}</span></div>
          <h2>One result, one target</h2>
          <p>Resolution sets the winning quote side and atomically applies its 70/30 target to internal NIGHT redemption limits. Expiry reapplies the existing target. Later trades may change the split; anyone can restore it. No assets move to an external exchange.</p>
          <div className="allocation"><div style={{ width: `${snapshot?.targetA ?? 50}%` }} /><div style={{ width: `${snapshot?.targetB ?? 50}%` }} /></div>
          <div className="allocation-labels"><span>QUOTE A · {snapshot?.targetA ?? 50}%</span><span>QUOTE B · {snapshot?.targetB ?? 50}%</span></div>
          <p>Side reserves: A {snapshot?.reserveA.toString() ?? "—"} · B {snapshot?.reserveB.toString() ?? "—"} atomic NIGHT. Fee pool: {snapshot?.feePool.toString() ?? "—"}.</p>
          <div className="action-row"><button type="button" className="button-secondary" disabled={Boolean(busy) || snapshot?.phase !== 2n || allocationApplied || !wallet} onClick={() => void run("rebalancing", async () => {
            const client = await getClient();
            setReceipt(await client.rebalance(contractAddress));
            await refreshAfterFinalized(contractAddress);
          }, "Rebalance did not finalize. Refresh public state and retry.")}>{busy === "rebalancing" ? "Restoring…" : "Restore target allocation"}</button></div>
          <p className="fine-print">Quote redemption is conditional on its side reserve. Allocation changes accounting limits; the contract retains custody of NIGHT.</p>
        </section>

        <section id="rewards" className="panel rewards-panel">
          <div className="panel-heading"><span className="section-index">05 / REWARDS</span><span className="panel-state">Trade incentive</span></div>
          <h2>KAI follows activity</h2>
          <p>The contract mints one million KAI units into its own custody once. Eligible contract-mediated trades send the fee amount in KAI to the same unshielded recipient while inventory remains. No market-signal reward or claim route exists.</p>
          <p>Distributed: {snapshot?.kaiDistributed.toString() ?? "—"} / 1000000 KAI atomic units.</p>
          {snapshot?.economyIssued && <details className="token-colors"><summary>View public token colors</summary><p>Quote A <code>{snapshot.quoteAColor}</code></p><p>Quote B <code>{snapshot.quoteBColor}</code></p><p>KAI <code>{snapshot.kaiColor}</code></p></details>}
        </section>

        <section id="settings" className="panel settings-panel">
          <div className="panel-heading"><span className="section-index">06 / SETTINGS</span><span className="panel-state">Diagnostics</span></div>
          <h2>Network and resolver</h2>
          <label className="field-label" htmlFor="contract-address">Preprod contract address</label>
          <input id="contract-address" value={contractAddress} onChange={(event) => {
            const next = event.target.value.trim();
            activeAddress.current = next;
            loadGeneration.current++;
            setContractAddress(next);
            setSnapshot(null);
            setPrepared(null);
            setSaved(false);
            setBundle("");
          }} placeholder="64-character contract address" autoComplete="off" spellCheck={false} />
          <div className="action-row"><button type="button" className="button-secondary" disabled={Boolean(busy) || !isContractAddress(contractAddress)} onClick={() => void run("refreshing", async () => { await refresh(); setMessage("Public Preprod state loaded."); }, "Could not read this contract from the Preprod indexer.")}>{busy === "refreshing" ? "Loading…" : "Load public state"}</button></div>
          <label className="field-label" htmlFor="local-password">Local storage password</label>
          <input id="local-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="16+ characters, 3 character classes" autoComplete="new-password" />
          <p className="fine-print">Used in this browser to encrypt Midnight signing keys. It is never sent to Kairos. Keep it safe; changing it may make existing local keys inaccessible.</p>
          <div className="action-row"><button type="button" className="button-secondary" disabled={Boolean(busy) || !wallet} onClick={() => void run("deploying", async () => {
            const client = await getClient();
            const deployed = await client.deploy();
            activeAddress.current = deployed.contractAddress;
            loadGeneration.current++;
            setContractAddress(deployed.contractAddress);
            setReceipt(deployed.receipt);
            setMessage("Kairos contract finalized on Preprod. Save its public address.");
            await refreshAfterFinalized(deployed.contractAddress);
          }, "Deployment did not finalize. Check local proof server, Lace, DUST, and generated artifacts.")}>{busy === "deploying" ? "Deploying and finalizing…" : "Deploy new Preprod contract"}</button>
          <button type="button" className="button-secondary" onClick={() => void run("checking", async () => {
            setProofStatus("unknown");
            const response = await fetch("http://127.0.0.1:6301/health");
            if (!response.ok) throw new Error("proof server unavailable");
            setProofStatus("ready");
            setMessage("Local proof server responded.");
          }, "Local proof server is unavailable at 127.0.0.1:6301.")}>Check local proof server</button></div>
          <p className="fine-print">Proof server: {proofStatus}. Private openings sent for proving stay on the local machine only if your browser uses this local service.</p>
        </section>

        <section className="panel resolver-panel">
          <div className="panel-heading"><span className="section-index">07 / RESOLUTION</span><span className="panel-state">Trusted resolver</span></div>
          <h2>Resolve the weekly round</h2>
          <p>After the public close time, paste eight opening files in commitment order. The resolver has one day to prove the winner and sees every side. If openings are missing, anyone can expire the round after that window; the allocation target stays unchanged.</p>
          <label className="field-label" htmlFor="opening-bundle">Private opening bundle</label>
          <textarea id="opening-bundle" value={bundle} onChange={(event) => setBundle(event.target.value)} placeholder="[ { version, contractAddress, round, side, salt }, ... ]" spellCheck={false} />
          <div className="action-row"><button type="button" className="button-primary" disabled={Boolean(busy) || !canResolve || !bundle} onClick={() => void run("resolving", async () => {
            if (!snapshot) throw new Error("no round");
            const openings = parseResolutionBundle(bundle, contractAddress, snapshot.round);
            const client = await getClient();
            const result = await client.resolve(contractAddress, openings);
            setReceipt(result);
            setBundle("");
            await refreshAfterFinalized(contractAddress);
          }, "Resolution failed. Check all eight openings, Lace, and local proving; no result was confirmed.")}>{busy === "resolving" ? "Proving and finalizing…" : "Prove result"}</button>
          <button type="button" className="button-secondary" disabled={Boolean(busy) || snapshot?.phase !== 2n || !allocationApplied || !wallet} onClick={() => void run("advancing", async () => {
            const client = await getClient();
            setReceipt(await client.startNextRound(contractAddress));
            await refreshAfterFinalized(contractAddress);
          }, "The next round did not finalize.")}>{busy === "advancing" ? "Starting…" : "Start next round"}</button>
          <button type="button" className="button-secondary" disabled={Boolean(busy) || !canExpire || !wallet} onClick={() => void run("expiring", async () => {
            const client = await getClient();
            setReceipt(await client.expire(contractAddress));
            await refreshAfterFinalized(contractAddress);
          }, "Expiry failed. The one-day resolution window may still be open; load public state and retry.")}>{busy === "expiring" ? "Expiring…" : "Expire missed round"}</button></div>
          {snapshot?.phase === 2n && !allocationApplied && <p className="fine-print">Restore the target allocation in Treasury after intervening trades before starting the next round.</p>}
        </section>
      </div>
      <footer><span>KAIROS / MIDNIGHT PREPROD</span><span>Private signal · Public policy · Contract-custodied trading</span></footer>
    </main>
  );
}
