# Kairos

> A private quote-side signal market with contract-custodied trading and public treasury reserve targets for Midnight Preprod.

## Live Demo

No public demo URL has been verified. Run the app locally using the instructions below.
For an owner-managed public deployment, follow [the Vercel Preprod guide](docs/DEPLOY_VERCEL.md). The production build refuses to publish an unverified contract address.

## Contract Address

| Network | Address |
| --- | --- |
| Preprod | `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f` |

Deployment transaction hash: `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc`. The Preprod indexer reports `SUCCESS` in block 2,686,941; all eight deployed verifier keys match this repository's current artifact. Run the read-only verification command below to recheck the live state. No post-deployment circuit call has been verified yet.

## What This Product Does

Kairos is building a self-rebalancing treasury driven by private market conviction. The Compact contract accepts eight salted quote-side commitments before a public weekly close, proves that all eight openings match the public commitments during a one-day resolution window, and publishes one winner. In the same resolution call it sets a 70/30 target for the winning side and reapportions internal NIGHT redemption capacity; a tie retains the previous target. Missing openings let anyone expire the round after the window and reapply the existing target. The next round starts only while the current reserve split matches that target.

The same contract now compiles with a fixed, one-time contract-custodied issuance of Quote A, Quote B, and KAI; public NIGHT/quote buy and sell routes with asymmetric basis-point fees; a fixed-supply KAI trade incentive; and a separate repair call for reserve splits changed by later trades. Resolution, expiry, and restoration append public treasury-action records; the UI reads the latest ten. These circuits and their accounting tests have **local evidence only** beyond deployment. No issuance, trade, or reserve change has been observed on Preprod. The route does not provide an external exchange or guarantee redemption when a side reserve is depleted. Wallet-to-wallet transfers bypass Kairos fees, so no token-wide tax is claimed.

## Initial Idea

Kairos aims to let private weekly market conviction guide a public DeFi treasury allocation. The contract proves a bounded aggregate signal, enforces seven-day round deadlines after a publicly chosen first close, and atomically applies its internal reserve policy with resolution or expiry. Someone must still submit those transactions; external liquidity execution remains unimplemented.

## Privacy Model

- **Public:** round close time, transaction timing, commitment order/count and hashes, round phase, winner, allocation targets, token colors, reserves, fees, trade side/amount/recipient, KAI distribution total, and historical treasury-action accounting.
- **Private from the public ledger:** the side and random salt supplied to each commitment circuit, and the eight openings supplied to the resolution circuit.
- **Proved:** every opening matches its indexed commitment and the published winner follows the complete eight-opening tally.

The participant must save an opening file and share it privately with a **trusted resolver**. That resolver sees all sides. Its proof server receives the full witness; use the included loopback-only proof server or another service you control. Commitments do not prove unique people or prevent one wallet from taking several positions. Eight-person cohorts and public timing may allow inference. These limits are documented in [the usage guide](docs/USAGE.md).

## Privacy Claim

An on-chain observer sees the commitment hash and transaction timing for each position but does not receive its side or salt in the public ledger. Resolution discloses the winning side, not the individual openings. This is a ledger privacy claim, not anonymity or privacy from the trusted resolver, proof server, wallet, or device.

## Tech Stack

Next.js 16, React 19, TypeScript, Compact language 0.23/compiler 0.31.1, Midnight.js 4.1.1, DApp Connector API 4.0.1, Lace, proof server 8.1.0, Vitest, and Playwright.

## Prerequisites

Node.js 22.22 or newer within 22.x, npm, Docker, Compact compiler 0.31.1, a Preprod Lace wallet for transactions, and Preprod DUST. On Windows, install Compact in WSL Ubuntu; the Windows `compact.exe` is an unrelated system tool.

## Setup & Run Locally

1. Copy `.env.example` to `.env.local` and keep `NEXT_PUBLIC_MIDNIGHT_NETWORK=preprod`.
2. Run `npm ci`.
3. Install Compact devtools 0.5.1 and compiler 0.31.1 using the [official setup guide](https://docs.midnight.network/getting-started/installation).
4. Run `npm run compact:compile` to create `contracts/managed/kairos` and public proving artifacts under `public/zk/kairos`.
5. Run `npm run proof:up` and `npm run proof:status`. The dedicated Kairos server binds `127.0.0.1:6301`. Lace separately uses a trusted local proof server at `http://localhost:6300` according to Midnight's [toolchain guide](https://docs.midnight.network/getting-started/installation); ensure that service is available before wallet transactions.
6. Run `npm run dev`, then open `http://localhost:3000` in a browser with Lace on Preprod.
7. Connect Lace, enter a 16+ character local storage password, and use the Settings panel to deploy a contract if no verified address is available. Deployment sets the first close to seven days from the browser's current time. Save the returned public address and transaction ID, then confirm the public close time. On a deployed contract, initialize the fixed token economy once before using the trade routes.

The app has no server-held wallet keys. The browser encrypts local Midnight signing-key storage using the password you supply. It is not a recovery phrase. Never send opening files to an untrusted resolver.

After a deployment finalizes, verify the address and receipt against the Preprod indexer and this build's verifier keys:

```text
npm run verify:preprod -- <contract-address> <deployment-transaction-id>
```

The command reports public state only. It cannot verify a missing address or substitute for a successful wallet transaction.

For a later finalized circuit call, check its transaction hash or identifier against the exact contract address and expected entry point:

```text
npm run verify:activity -- <contract-address> <transaction-id> <Kairos-circuit-id>
```

This read-only check confirms a successful call on Preprod. It does not prove that a particular person used the app or that token balances changed by an expected amount. Verify the deployment first, then inspect public state and balances for any economic claim.

## Run Tests

```text
npm run compact:compile
npm run test:contracts
npm run verify:fast
npm run build
npm run test:e2e
npm run proof:smoke
```

`npm run verify` runs compile, contract tests, fast checks, and build. Browser tests need Playwright Chromium (`npx playwright install chromium`). `proof:smoke` additionally requires the local proof server at `127.0.0.1:6301` and checks/proves all eight circuits with synthetic inputs. It does not balance or submit a transaction. Local checks are not evidence of a successful Preprod transaction.

## CI/CD

`.github/workflows/ci.yml` runs the compiler, tests, typecheck, lint, build, and browser tests on pushes to `main` and pull requests. There is no repository remote or passing hosted CI run verified in this checkout, so no green badge is shown.

## Usage Guide

See [docs/USAGE.md](docs/USAGE.md).

## Product Proposal

See [PROPOSAL.md](PROPOSAL.md). The owner's required proposal answers and organizer/category approval remain pending.

## Product X Profile

No product X account or profile URL has been verified. Launch copy drafts are in [docs/OUTREACH.md](docs/OUTREACH.md).

## Demo Video and Screenshots

The owner will record the video and screenshots after a real Preprod deployment. The [usage guide](docs/USAGE.md) contains a one-minute capture checklist. No media evidence is claimed here.

## Level 5 — User Validation

Target: 50 verified Preprod users. Current verified count: **0/50**. See [USERS.md](USERS.md) and [docs/FEEDBACK.md](docs/FEEDBACK.md). A wallet address alone does not prove a distinct person.

## Project Status

See [the Level 1–5 evidence table](docs/challenge/IMPLEMENTATION_STATUS.md) and [docs/agent/STATE.md](docs/agent/STATE.md). The current contract deployment is verified; there is no verified circuit call, public demo, hosted CI badge, organizer approval, or user feedback yet.
