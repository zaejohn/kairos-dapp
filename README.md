# KAIROS

[![CI](https://github.com/zaejohn/kairos-dapp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/zaejohn/kairos-dapp/actions/workflows/ci.yml)

**Private market conviction, public treasury rules, on Midnight Preprod.** Kairos is a quote-side signal market and contract-custodied trading prototype. Participants commit to a side without publishing it; a trusted resolver later proves the complete eight-position tally. The result sets a public treasury reserve target. Quote trades and treasury accounting are public.

## Quick links and current status

Evidence snapshot: **26 September 2026**. Latest published `main` CI: **`d5bd45a`, success**. Local changes and live state are reported separately in the [requirement audit](docs/challenge/LEVELS_4_6_AUDIT.md).

| Item                        | Link or observation                                                                                                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public source               | [GitHub repository](https://github.com/zaejohn/kairos-dapp) · [commit history](https://github.com/zaejohn/kairos-dapp/commits/main)                                                                                                                                    |
| Public demo                 | [kairos-dapp.vercel.app](https://kairos-dapp.vercel.app) — homepage, health route, robots file, sitemap, and one proving asset were accessible without sign-in at this audit.                                                                                          |
| Demo video                  | [Kairos demo recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing) (Google Drive; link supplied by the project owner).                                                                                                        |
| X profile                   | [X Profile](https://x.com/usekairosdApp)                                                                                                                                                                                                                               |
| Midnight network            | **Preprod only**                                                                                                                                                                                                                                                       |
| Contract address            | `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f`                                                                                                                                                                                                     |
| Deployment transaction hash | `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc`                                                                                                                                                                                                     |
| Deployment verification     | Read-only [verifier](scripts/midnight/verify-preprod-deployment.mjs) returned `SUCCESS` in block **2,686,941** and matched all **eight** deployed verifier keys to this build. [Recheck it](#verify-the-contract-and-submission-evidence).                             |
| CI | [Latest successful main run](https://github.com/zaejohn/kairos-dapp/actions/runs/36223626837): quality and browser jobs passed at `d5bd45a`. The badge tracks published `main`, not unpublished local edits. |
| Git history | **61 commits** at audited published `main` (`d5bd45a`); [substantive milestone examples](#commit-history). |

## Contract Address

| Network | Address |
|---------|---------|
| Preprod | `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f` |

The Compact source is unchanged by this audit; no redeployment is required.

## Initial product idea

Kairos lets participants express a private weekly view on one of two quote sides. The Compact contract accepts eight salted commitments, verifies their openings in a later resolution proof, publishes the winning side, and applies a transparent 70/30 target to internal NIGHT redemption reserves. Participants initiate transactions, a trusted resolver sees the openings, and the current treasury target covers internal accounting.

## Product and user flow

1. A participant connects a compatible wallet on Preprod, chooses Quote A or B, downloads a private opening file, and submits its commitment before the public close time.
2. A trusted resolver receives **all eight** opening files privately. After close, the resolution circuit verifies each opening against its indexed public commitment and publishes the winner. A tie keeps the previous target. A missed round can expire after the resolution window.
3. Resolution or expiry applies the target to **internal** NIGHT redemption reserves. A separate call can restore the target after later trades; the next round starts only when the reserve split matches its target.
4. A one-time issuance circuit and public NIGHT/quote buy and sell circuits implement the contract-custodied token economy, fees, and bounded KAI trade incentive. Treasury actions append public accounting records.

The contract has compiled and local accounting/proving checks have passed. The deployment is independently verified; post-deployment circuit activity is a separate verification step. Fresh public state reports `economyIssued: true`, eight commitments in round 1, and nonzero reserves and trading fees. Individual circuit transaction hashes and the complete round-resolution flow remain unverified. Economic scope is contract-custodied trading and internal reserve accounting, with redemption limited by each side's available reserve. See [usage](docs/USAGE.md) and [capability boundaries](docs/research/PRODUCT_CAPABILITIES.md).

## Privacy Model — PUBLIC / PRIVATE / PROVEN

- **PUBLIC:** indexed commitment hashes, round timing, winner, reserve targets, token economy and trades.
- **PRIVATE:** individual side and salt stay off the public ledger; the participant, trusted resolver and their proof server can see the opening.
- **PROVEN:** commitments and all eight resolution openings satisfy the contract rules; the winner and reserve accounting follow the verified tally.

| Data                                                                  | Who can learn it?                                            | What the circuit establishes                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Round time and phase; indexed commitment hashes and count             | Anyone reading the public ledger                             | A commitment is recorded before close.                                                                  |
| Individual side and random salt                                       | Participant; later the trusted resolver and its proof server | The commitment circuit uses them without writing them as public state.                                  |
| All eight openings                                                    | Trusted resolver and its proof server during resolution      | The resolution proof checks each opening against its public indexed commitment and computes the winner. |
| Winner, target, reserves, fees, token colors, treasury-action history | Anyone reading public state                                  | The contract applies its public accounting rules.                                                       |
| Trade side, amount, fee, and unshielded recipient                     | Anyone reading the public transaction                        | Trades are public.                                                                                      |

An on-chain observer sees each commitment's hash, index, and timing. The side and salt stay off the public ledger; resolution publishes the winner. This is **ledger privacy**. The resolver, its proof server, the participant's device, and recipients of an opening can learn the side. Timing and a small cohort can permit inference, and one wallet can submit several commitments. Keep opening files, local storage passwords, and wallet secrets private. See [the full privacy model](docs/product/PRIVACY_MODEL.md).

## Tech Stack

Next.js **16.3.6**, React **19.3.0**, TypeScript **6.0.3**, Compact compiler **0.31.1** / runtime **0.16.0**, Midnight.js **4.1.1**, Connector API **4.0.1**, ledger/proof server **8.1.0**, Midnight Lace, Vitest and Playwright. Exact pins: [package.json](package.json) and [version matrix](docs/midnight/VERSIONS.md).

## Run locally

### Prerequisites

- Node.js **22.22 or newer in the 22.x line**, npm, Docker, and Compact devtools **0.5.1** with compiler **0.31.1**. Follow the [Midnight installation guide](https://docs.midnight.network/getting-started/installation). On Windows, install and run Compact through **WSL Ubuntu**; Windows' `compact.exe` is unrelated.
- Read-only viewing works directly in the browser. Transactions use Midnight Lace on **Preprod** with DUST; public quote trades also require the unshielded input asset.
- Each transaction user's machine runs Kairos' local proof server **8.1.0** at `127.0.0.1:6301`. Lace uses a separate trusted local proof server at `localhost:6300`; both services run on the user's device when the app is hosted on Vercel.

### Install and start

1. Clone the [repository](https://github.com/zaejohn/kairos-dapp), copy `.env.example` to `.env.local`, and keep `NEXT_PUBLIC_MIDNIGHT_NETWORK=preprod` and the supplied verified contract address. In PowerShell: `Copy-Item .env.example .env.local`. In Bash: `cp .env.example .env.local`.
2. From the repository root, run:

   ```sh
   npm ci
   npm run compact:compile
   npm run proof:up
   npm run proof:status
   npm run dev
   ```

3. Open `http://localhost:3000`. Select **Enter the Garage**, then use the workshop stations or the tablet/mobile navigation. The configured contract loads automatically for regular users.
4. For Lace transactions, also start/configure Lace's **separate** trusted proof service on port 6300 as described in the [Vercel and local proof guide](docs/DEPLOY_VERCEL.md). In **Settings**, enter a strong local storage password, select **Save password**, confirm it is saved for this browser session, and select **Check local proof server**. Grant the browser's Local Network Access prompt if it appears. This password protects local Midnight signing-key storage; keep your wallet recovery phrase separate.

`npm run compact:compile` generates `contracts/managed/kairos` (contract code, circuits, and keys) and `public/zk/kairos` (browser proving assets). Both directories are **generated and Git-ignored**; run the compile command to create them locally or during the build. Confirm whether the submission expects generated assets in Git or accepts reproducible generation.

### Configuration

| Variable                              | Local / production use                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_MIDNIGHT_NETWORK`        | Must be `preprod`.                                                                        |
| `NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS` | The verified public 64-hex contract address above.                                        |
| `KAIROS_DEPLOYMENT_TX_ID`             | The public deployment hash above, required by the production build verifier.              |
| `KAIROS_SITE_URL`                     | Canonical HTTPS production origin for metadata and sitemap; set in Vercel for production. |
| `MIDNIGHT_PROOF_SERVER_URL`           | Local developer scripts only; default `http://127.0.0.1:6301`.                            |

Configuration uses public network values and client-side wallet signing; API keys, database credentials, and server-held wallet secrets are unnecessary. Production Vercel settings, domain choices, and public-route checks are documented in [DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md). **Local developer controls** for replacement deployment appear in development builds; the public site uses its configured contract.

## Verify the contract and submission evidence

### Compile, generated files, and tests

Run `npm run compact:compile` and inspect the output and `contracts/managed/kairos/keys`. The expected eight circuits are `initializeEconomy`, `buyQuote`, `sellQuote`, `commitPosition`, `resolveRound`, `expireRound`, `rebalanceTreasury`, and `startNextRound`. Each has generated prover/verifier material. Then run:

```sh
npm run verify
npx playwright install chromium
npm run test:e2e
```

`npm run verify` compiles, runs contract and application tests, lint and typecheck, validates the public evidence tables, and builds the app. The [latest published CI run](https://github.com/zaejohn/kairos-dapp/actions/runs/36223626837) passed both quality and browser jobs; the earlier intro-flow mismatch has been resolved. See the [CI workflow](.github/workflows/ci.yml), [test screenshot](docs/evidence/contract-tests.png), and [current local checks](docs/challenge/LEVELS_4_6_AUDIT.md).

The local `npm run proof:smoke` command checks and proves eight circuits with inputs against the local proof server. Use finalized Preprod receipts for wallet and network verification.

### Verify the finalized deployment

With generated artifacts present, run this **read-only** command:

```sh
npm run verify:preprod -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc
```

It queries the [Midnight Preprod indexer](https://indexer.preprod.midnight.network/api/v4/graphql), checks that the transaction deployed this exact address with final `SUCCESS`, and compares all eight deployed verifier keys with the local build. The deployment finalized in block **2,686,941**. The fresh state snapshot is round **1**, phase **1** (full), and `economyIssued: true`. Current round and economy fields can change after future transactions.

### Verify an actual frontend circuit call

1. On the [public demo](https://kairos-dapp.vercel.app) in the browser profile with Preprod Lace, select **Enter the Garage**, then **Wallet** and connect Lace. In **Settings**, enter and **save** the local storage password, then confirm the local proof server. The wallet should show Preprod and the connected addresses/balance.
2. Open **Trading Engine** in a round with space before its close. The audited round is full; coordinate the next round with the resolver. Choose a side, prepare and download its opening file, acknowledge that it is saved, then submit the commitment and approve the wallet request. Keep the opening private.
3. Wait for a **finalized** receipt. Record its public transaction hash or identifier and refresh public state.
4. From the repository root, run:

   ```sh
   npm run verify:activity -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f <finalized-transaction-hash-or-identifier> commitPosition
   ```

   Replace the placeholder with the **circuit call's** finalized ID. The command must report a successful `commitPosition` call to this contract. Check that the public commitment count increased while the opening's side and salt remain private. A circuit call verifies activity, while participant counts require separate evidence.

5. To demonstrate a complete round, obtain eight openings in public index order through a private channel, resolve within the one-day window after close, and verify the `resolveRound` transaction and new public target. For the economic extension, verify `initializeEconomy`, `buyQuote`/`sellQuote`, and `rebalanceTreasury` **separately** with their own finalized receipts and public-state changes. See [the detailed usage guide](docs/USAGE.md).

The [evidence audit](docs/challenge/LEVELS_4_6_AUDIT.md) records the finalized deployment and fresh public state. Add independently verified circuit receipts as they become available; public state does not identify the tester or originating frontend.

## CI/CD

[CI](.github/workflows/ci.yml) runs on pushes to main and pull requests: pinned Compact compile → contract tests → lint/typecheck/application and evidence tests → production build → Chromium flows. [Vercel](docs/DEPLOY_VERCEL.md) separately compiles artifacts, verifies the configured Preprod deployment, and builds the frontend. CI does not deploy a contract or establish wallet activity.

## Level 5 — User Validation

- Target: 50 Preprod users
- Current: **50 / 50** real tester submissions, exactly CSV rows **2–51**
- See [USERS.md](USERS.md) for validated Preprod unshielded addresses and dates
- See [docs/FEEDBACK.md](docs/FEEDBACK.md) for 49 nonblank comments, one preserved blank, and two feedback-backed improvements

## Level 6 — Additional User Evidence

- Target: 20 additional users in the requested Preprod roster
- Current: **22 / 20**, exactly CSV rows **52–73**, with no overlap with Level 5
- See [LAUNCH_USERS.md](LAUNCH_USERS.md), [feedback and iterations](docs/FEEDBACK.md#level-6-improvements), [brand brief](docs/BRAND.md), [onboarding](docs/ONBOARDING.md), and [demo checklist](docs/DEMO_CHECKLIST.md)

The owner confirms all CSV entries are real testers. All 72 addresses pass the pinned Midnight SDK checksum/network/type checks; dates and row alignment are validated. The CSV has no transaction IDs or signed wallet-control attestations. The public [sanitized evidence](docs/evidence/user-feedback.json) omits names/emails and preserves source rows and exact comments.

**Official Level 6 remains incomplete:** Rise In requires a Mainnet launch and users onboarded after launch. These 22 entries are Preprod testers; no Mainnet deployment or post-launch Mainnet cohort is claimed. See the [official program overview](https://www.risein.com/blog/new-moon-to-full-rise-in-and-midnight-introduce-a-builder-path-for-privacy-first-dapps) and [requirement-by-requirement audit](docs/challenge/LEVELS_4_6_AUDIT.md).

## Usage, Feedback and Submission

Use the [usage guide](docs/USAGE.md) for wallet setup, the first transaction, verification and troubleshooting. Feedback about delays led to optional startup recovery and public-state loading/retry controls; [the feedback log](docs/FEEDBACK.md) maps the exact comments to changes. These local improvements require publication before the hosted demo includes them.

[Product proposal](PROPOSAL.md) · [Product X profile](https://x.com/usekairosdApp) · [launch/outreach drafts](docs/OUTREACH.md) · [full requirement audit and remaining actions](docs/challenge/LEVELS_4_6_AUDIT.md). Organizer proposal/category approval and public X posts remain owner-supplied evidence.

## Commit History

Published main had **61 commits** at `d5bd45a`. Examples: [Compact contract](https://github.com/zaejohn/kairos-dapp/commit/7f5aee6), [contract tests](https://github.com/zaejohn/kairos-dapp/commit/db65b55), [wallet integration](https://github.com/zaejohn/kairos-dapp/commit/5e47e8c), [CI pipeline](https://github.com/zaejohn/kairos-dapp/commit/bff003e), [private signal market](https://github.com/zaejohn/kairos-dapp/commit/7315e2c), [quote economy](https://github.com/zaejohn/kairos-dapp/commit/905e685), and [deployment verification](https://github.com/zaejohn/kairos-dapp/commit/03e005b). Meaningful milestones are reviewed individually; total count alone is not proof of significance.

<details>
<summary>Existing compile, contract-test and deployment screenshots</summary>

![Compact compilation](docs/evidence/compact-compile.png)
![Twelve contract tests](docs/evidence/contract-tests.png)
![Preprod deployment verification](docs/evidence/preprod-deployment.png)

These are earlier captured evidence; dated current results are in the audit.
</details>
