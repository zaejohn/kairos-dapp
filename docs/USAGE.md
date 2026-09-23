# How to Use Kairos

## What You Need

- A browser with Lace connected to Midnight Preprod and enough DUST for transactions.
- The local Kairos app and its dedicated proof server at `127.0.0.1:6301`.
- A trusted resolver who will collect all eight opening files for a full round.

## Step-by-Step Guide

1. Start the app as described in the README and check the proof server in Settings.
2. Connect Lace and confirm it is on Preprod. Set a strong local storage password in Settings. Keep this password safe; it protects Midnight signing-key storage in this browser.
3. Load a verified Preprod contract address in Settings. If you are the operator and no address exists, use **Deploy new Preprod contract** and record the finalized address and transaction ID. A deployment is real only after the app shows a finalized receipt and public state can be read.
4. In an open round, choose Quote A or Quote B and select **Prepare private opening**. Download the JSON opening. Keep it private and backed up.
5. Acknowledge that you saved it, then submit the commitment through Lace. Keep the opening even if the app shows an error until you verify whether the transaction finalized.
6. After eight commitments, send each opening to the trusted resolver through a private channel. Each file contains its side and salt. The resolver orders all eight by public commitment index and pastes their JSON objects as one array into the resolution panel.
7. The resolver proves the complete round. The public state then shows the winner and 70/30 allocation target. A tie preserves the previous target. The operator can start the next round.

The current product has no token trades, deposits, yield, or rewards. The allocation target is a public policy value; no liquidity moves automatically.

## What Gets Proved (and What Stays Private)

Each commitment is a hash of the round, side, and random salt. The public ledger stores the hash and its order. The resolution proof checks all eight openings against those hashes and publishes only the winning side. The individual side is hidden from public ledger data, but the trusted resolver and the proof server it uses see every opening. Public transaction timing and a small group may reveal clues. Anyone can submit multiple commitments; there is no unique-user proof.

## Troubleshooting

- **No Lace wallet:** open the app in the browser profile where Lace is installed and enabled.
- **Wrong network:** switch Lace to Midnight Preprod, then reconnect.
- **Proof server unavailable:** run `npm run proof:up` and `npm run proof:status`; the browser must reach `http://127.0.0.1:6301/health`. Lace's own local-proving setting may also require a trusted service at `localhost:6300`.
- **No public state:** confirm the 64-character address belongs to a deployed Preprod contract, then retry after indexer propagation.
- **Proof or submission error:** retain the opening file, check DUST, Lace prompts, proof server health, and the current round before retrying. Inspect the public contract state before assuming a failed transaction.
- **Round advanced before submission:** the contract rejects an opening made for an older round. Load the new round and prepare a fresh opening.
- **Resolution fails:** provide exactly eight valid opening objects in commitment order, all for this contract and round. A missing or altered salt cannot be recovered by Kairos.

## One-Minute Demo Capture Checklist

After a real Preprod contract and transaction are verified, show Lace connecting on Preprod, a saved opening and commitment submission, the finalized transaction/updated public state, the four passing contract tests in the terminal, and the README's verified address. Show the hosted CI badge only if its run is actually green. Do not display an opening's side/salt, local storage password, or wallet secrets in the recording.
