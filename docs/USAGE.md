# How to Use Kairos

## What You Need

- A browser with Lace connected to Midnight Preprod and enough DUST for transactions.
- The local Kairos app and its dedicated proof server at `127.0.0.1:6301`.
- A trusted resolver who will collect all eight opening files for a full round.

## Step-by-Step Guide

1. Start the app as described in the README and check the proof server in Settings.
2. Connect Lace and confirm it is on Preprod. Set a strong local storage password in Settings. Keep this password safe; it protects Midnight signing-key storage in this browser.
3. Load a verified Preprod contract address in Settings. If you are the operator and no address exists, use **Deploy new Preprod contract** and record the finalized address and transaction ID. Run `npm run verify:preprod -- <address> <transaction-id>` to check the indexer result and current eight-circuit artifact. The first round closes seven days after deployment was requested; confirm the public close time in the status strip. A deployment is real only after the app shows a finalized receipt and public state can be read.
4. In an open round, choose Quote A or Quote B and select **Prepare private opening**. Download the JSON opening. Keep it private and backed up.
5. Acknowledge that you saved it, then submit the commitment through Lace. Keep the opening even if the app shows an error until you verify whether the transaction finalized.
6. Before the public close time, send each opening to the trusted resolver through a private channel. Each file contains its side and salt. The resolver orders all eight by public commitment index and pastes their JSON objects as one array into the resolution panel.
7. After close and within one day, the resolver proves a complete eight-position round. The same transaction publishes the winner, sets the 70/30 target, and reapportions internal NIGHT redemption limits. A tie preserves the previous target. If openings are missing or the resolver misses that window, anyone may select **Expire missed round** after the one-day window; it reapplies the existing target without publishing a new winner.
8. A new round cannot start unless the current reserve split matches the target. If later trades change the split, use **Restore target allocation** before starting the next round. Read the side reserves before trading: a quote cannot be sold if its side reserve is insufficient.
9. If the three tokens have not yet been issued, use **Initialize fixed token economy** once. For a trade, choose Buy or Sell, a quote side, and a gross whole-number amount in atomic units. Review the public fee and net output before submitting through Lace. A trade may also distribute KAI while fixed inventory remains.

The economic circuits compile and pass local accounting tests, but no issuance or trade has been confirmed on Preprod yet. Treasury allocation changes internal redemption limits, not external liquidity. There is no yield, market-signal reward, or KAI redemption promise. Trading uses public unshielded assets; direct transfers outside Kairos do not pay its fee.

## What Gets Proved (and What Stays Private)

Each commitment is a hash of the round, side, and random salt. The public ledger stores the hash and its order. The resolution proof checks all eight openings against those hashes and publishes only the winning side. The individual side is hidden from public ledger data, but the trusted resolver and the proof server it uses see every opening. Public transaction timing and a small group may reveal clues. Anyone can submit multiple commitments; there is no unique-user proof.

Token issuance, trade side, gross amount, fee, payout address, reserve values, and KAI distribution total are public. A trade does not hide its buyer or seller's economic action.

## Troubleshooting

- **No Lace wallet:** open the app in the browser profile where Midnight Lace is installed and enabled. Allow the extension to access `localhost:3000`, then reload the page.
- **Wrong network:** switch Lace to Midnight Preprod, then reconnect. Lace may report this during connection as `Network ID mismatch`.
- **Proof server unavailable:** run `npm run proof:up` and `npm run proof:status`; the browser must reach `http://127.0.0.1:6301/health`. Lace's local-proving setting separately uses a trusted service at `http://localhost:6300`.
- **No public state:** confirm the 64-character address belongs to a deployed Preprod contract, then retry after indexer propagation.
- **Verifier rejects the address:** confirm that the transaction ID belongs to that deployment and that the browser was refreshed after the latest contract compile. An older Kairos deployment needs its matching older artifacts and cannot verify as the current build.
- **Proof or submission error:** retain the opening file, check DUST, Lace prompts, proof server health, and the current round before retrying. If Kairos shows a submitted transaction ID while finalization remains pending, record it and check Preprod before retrying; submission alone does not prove success.
- **Round advanced before submission:** the contract rejects an opening made for an older round. Load the new round and prepare a fresh opening.
- **Resolution fails:** provide exactly eight valid opening objects in commitment order, all for this contract and round. A missing or altered salt cannot be recovered by Kairos.
- **Deadline blocks a call:** commitments close at the displayed time; resolution opens then and lasts one day. After that, expire the round and restore the target only if later trades changed the split before starting the next seven-day round.
- **Trade fails:** check that genesis was finalized, that your Lace wallet has the input asset and DUST, that quote inventory covers a buy, or that the selected side reserve covers a sell. Refresh the public state after any transaction before retrying.

## One-Minute Demo Capture Checklist

After a real Preprod contract and transaction are verified, show Lace connecting on Preprod, a saved opening and commitment submission, the finalized transaction/updated public state, the passing contract tests in the terminal, and the README's verified address. Show a trade or reserve call only after its own finalized transaction is verified. Show the hosted CI badge only if its run is actually green. Do not display an opening's side/salt, local storage password, or wallet secrets in the recording.
