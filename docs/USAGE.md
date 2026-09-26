# How to Use Kairos

## Getting Started on Preprod

Open [KAIROS](https://kairos-dapp.vercel.app) in the browser profile containing your Midnight wallet. Select **Enter the Garage**, then use the image stations or mobile navigation. In the updated app, slow artwork offers **Enter while artwork loads** after eight seconds; the artwork can continue loading while you use the stations.

New here? Follow the six-step [onboarding guide](ONBOARDING.md).

### Wallet Setup and What You Need

- A browser with Lace connected to Midnight Preprod and enough DUST for transactions.
- The local Kairos app or a verified public deployment, plus a dedicated proof server at `127.0.0.1:6301` on your own device. Lace separately needs its proof server on port 6300.
- A trusted resolver who will collect all eight opening files for a full round.

## Wallet Connection and Your First Transaction

1. Start the app as described in the README. Use the workshop image or station navigation to open **Settings** and check the proof server.
2. Open **Wallet** and choose a detected compatible Midnight wallet on Preprod. Lace has been observed in the owner's browser; the 1AM selection path has local browser-mock evidence only. In **Settings**, enter a strong local storage password and select **Save password**. Wait for the green **Ready in this tab** status before submitting; an existing encrypted signing key is checked when present. **Update password** rotates this wallet's locally encrypted signing keys before the new password becomes active. Keep the password safe: encrypted keys remain in browser storage, but the password itself stays only in tab memory and must be re-entered after a reload. **Disconnect in Kairos** clears local private inputs and the password, but wallet site permission must be managed in the wallet. Settings can request wallet-reported unshielded balances; token labels depend on a loaded contract's public colors.
3. The site loads its configured Preprod contract automatically; regular users do not enter an address or deploy a contract. The verified contract is `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f`, with finalized deployment transaction hash `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc`. Use **Settings → Load public state** if the displayed state is stale, then confirm the public close time in the **Trading Engine** status strip. Operators deploying a replacement should follow [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).
4. Open **Trading Engine**. The public-state message distinguishes a pending read from failure; use **Refresh market state** to read again without leaving the panel or connecting a wallet. This read does not submit a transaction. In an open round with fewer than eight commitments, choose Quote A or Quote B and select **Prepare private opening**. Download the JSON opening. Keep it private and backed up. If the round is full, wait for resolution/expiry and the next round; do not keep retrying a commitment.
5. Acknowledge that you saved it, then submit the commitment through Lace. Keep the opening even if the app shows an error until you verify whether the transaction finalized.
   Open **My position files and receipts** to preview a saved opening locally. It shows the selected side on your device without uploading the file. A file alone does not prove that a transaction reached Preprod. After a finalized submission, Kairos saves its public round, block, and transaction ID in this browser for the connected wallet and contract. After a refresh, reconnect the same wallet to see those receipts. The opening file, its side, and its salt are not saved in browser storage; select your downloaded JSON again to preview it. If browser storage is blocked or cleared, keep the transaction ID separately.
6. Before the public close time, send each opening to the trusted resolver through a private channel. Each file contains its side and salt. The resolver orders all eight by public commitment index and pastes their JSON objects as one array into the resolution panel.
7. After close and within one day, the resolver proves a complete eight-position round. The same transaction publishes the winner, sets the 70/30 target, and reapportions internal NIGHT redemption limits. A tie preserves the previous target. If openings are missing or the resolver misses that window, anyone may select **Expire missed round** after the one-day window; it reapplies the existing target without publishing a new winner.
8. A new round cannot start unless the current reserve split matches the target. If later trades change the split, open **Treasury** and use **Restore target allocation** before starting the next round. Read the side reserves before trading: a quote cannot be sold if its side reserve is insufficient.
   The Treasury panel reads public contract history for resolution, expiry, and restoration actions. Each entry records the round, result, target, reserves, and fee pool after the action. The contract history does not store transaction IDs or timestamps; the latest finalized non-commitment transaction receipt in the Treasury view is session-only.
9. If the three tokens have not yet been issued, use **Initialize fixed token economy** once in **Trading Engine**. For a trade, choose Buy or Sell, a quote side, and a gross whole-number amount in atomic units. Review the public fee and net output before submitting through the connected wallet. A trade may also distribute KAI while fixed inventory remains.

Check the dated [live evidence audit](challenge/LEVELS_4_6_AUDIT.md) for the latest verified circuit receipts. Treasury allocation changes internal redemption limits, not external liquidity. There is no yield, market-signal reward, or KAI redemption promise. Trading uses public unshielded assets; direct transfers outside Kairos do not pay its fee.

## Transaction Verification

Wait for **finalized** and retain the public transaction ID and block number. Reconnect the same wallet after reload to restore saved commitment receipts. A private opening file proves neither submission nor finalization.

With the repository installed, independently check a receipt against the Preprod indexer:

```sh
npm run verify:activity -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f <finalized-transaction-hash-or-identifier> commitPosition
```

Replace the placeholder with your public receipt and use the actual circuit name for another action. The verifier must confirm success, contract address, and circuit. The deployment transaction is not a commitment receipt. Keep side, salt and opening files out of public evidence.

## What Gets Proved (and What Stays Private)

Each commitment is a hash of the round, side, and random salt. The public ledger stores the hash and its order. The resolution proof checks all eight openings against those hashes and publishes only the winning side. The individual side is hidden from public ledger data, but the trusted resolver and the proof server it uses see every opening. Public transaction timing and a small group may reveal clues. Anyone can submit multiple commitments; there is no unique-user proof.

Token issuance, trade side, gross amount, fee, payout address, reserve values, and KAI distribution total are public. A trade does not hide its buyer or seller's economic action.

## Troubleshooting

- **No Lace wallet:** open the app in the browser profile where Midnight Lace is installed and enabled. Allow the extension to access `localhost:3000`, then reload the page.
- **Wrong network:** switch Lace to Midnight Preprod, then reconnect. Lace may report this during connection as `Network ID mismatch`.
- **Proof server unavailable:** run `npm run proof:up` and `npm run proof:status` on your device; the browser must reach `http://127.0.0.1:6301/health`. On a public HTTPS deployment, grant the browser's Local Network Access permission for that origin. Lace's local-proving setting separately uses a trusted service at `http://localhost:6300`.
- **Slow entry:** after eight seconds, select **Enter while artwork loads** if offered. If JavaScript itself did not load, check your connection and reload.
- **No public state:** use **Trading Engine → Refresh market state** or **Settings → Load public state** after indexer propagation. A pending read is not a transaction. Previously loaded values are labeled while refreshing or after failure. If it remains unavailable, ask the site operator to verify the configured contract address and Preprod indexer.
- **Verifier rejects the address:** confirm that the transaction ID belongs to that deployment and that the browser was refreshed after the latest contract compile. An older Kairos deployment needs its matching older artifacts and cannot verify as the current build.
- **Proof or submission error:** retain the opening file, check DUST, Lace prompts, proof server health, and the current round before retrying. If Kairos shows a submitted transaction ID while finalization remains pending, record it and check Preprod before retrying; submission alone does not prove success.
- **Round advanced before submission:** the contract rejects an opening made for an older round. Load the new round and prepare a fresh opening.
- **Resolution fails:** provide exactly eight valid opening objects in commitment order, all for this contract and round. A missing or altered salt cannot be recovered by Kairos.
- **Deadline blocks a call:** commitments close at the displayed time; resolution opens then and lasts one day. After that, expire the round and restore the target only if later trades changed the split before starting the next seven-day round.
- **Trade fails:** check that genesis was finalized, that your Lace wallet has the input asset and DUST, that quote inventory covers a buy, or that the selected side reserve covers a sell. Refresh the public state after any transaction before retrying.

## One-Minute Demo Capture Checklist

Use the [recording checklist](DEMO_CHECKLIST.md): wallet connection, complete participant flow, finalized receipt, privacy boundary, passing tests and current CI. Show a trade or reserve call only with its own verified finalized transaction. Do not display an opening's side/salt, local storage password, or wallet secrets.
