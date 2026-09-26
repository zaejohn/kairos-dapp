# KAIROS

[![CI](https://github.com/zaejohn/kairos-dapp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/zaejohn/kairos-dapp/actions/workflows/ci.yml)

**Private market conviction, public treasury rules, on Midnight Preprod.** Kairos is a quote-side signal market and contract-custodied trading prototype. Participants commit to a side without publishing it; a trusted resolver later proves the complete eight-position tally. The result sets a public treasury reserve target. Quote trades and treasury accounting are public.

## Quick links and current status

Evidence checked: **26 September 2026**. [Level 4–6 verification](#level-46-verification) below follows the supplied Preprod submission checklist. Latest **fully successful** CI: [`d5bd45a`, run 36223626837](https://github.com/zaejohn/kairos-dapp/actions/runs/36223626837). Newer `main` run at `8c74070`: quality passed; e2e failed during Compact installation, before browser tests ran.

| Item                        | Link or observation                                                                                                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public source               | [GitHub repository](https://github.com/zaejohn/kairos-dapp) · [commit history](https://github.com/zaejohn/kairos-dapp/commits/main)                                                                                                                                                                      |
| Public demo                 | [kairos-dapp.vercel.app](https://kairos-dapp.vercel.app) — homepage, health route, robots file, sitemap, and one proving asset were accessible without sign-in at this audit.                                                                                                                            |
| Demo video                  | [Kairos demo recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing) (Google Drive; link supplied by the project owner).                                                                                                                                          |
| X profile                   | [https://x.com/usekairosdApp](https://x.com/usekairosdApp)                                                                                                                                                                                                                                               |
| Midnight network            | **Preprod only**                                                                                                                                                                                                                                                                                         |
| Contract address            | `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f`                                                                                                                                                                                                                                       |
| Deployment transaction hash | `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc`                                                                                                                                                                                                                                       |
| Deployment verification     | Read-only [verifier](scripts/midnight/verify-preprod-deployment.mjs) returned `SUCCESS` in block **2,686,941** and matched all **eight** deployed verifier keys to this build. [Recheck it](#verify-the-contract-and-submission-evidence).                                                               |
| CI                          | [Latest fully successful run](https://github.com/zaejohn/kairos-dapp/actions/runs/36223626837) at `d5bd45a`; [newer main run](https://github.com/zaejohn/kairos-dapp/actions/runs/36227285212) at `8c74070` has a passing quality job and failed e2e setup. The dynamic badge shows current main status. |
| Git history                 | **64 commits** at published `main` (`8c74070`); [history and substantive examples](#commit-history). Meaningful-commit thresholds need content review, not just a raw count.                                                                                                                             |

**User/feedback spreadsheet:** [https://docs.google.com/spreadsheets/d/1SvYDOYWMjg3rMkskM7-g9qaayvnPohabXC1kBcVhWKA/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1SvYDOYWMjg3rMkskM7-g9qaayvnPohabXC1kBcVhWKA/edit?usp=sharing)

Public CSV export was checked without sign-in and matches the 72 saved tester records.

## Contract Address

| Network | Address                                                            |
| ------- | ------------------------------------------------------------------ |
| Preprod | `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f` |

The Compact source is unchanged by this audit; no redeployment is required.

## Level 4–6 Verification

This checklist uses the **Preprod requirements supplied for this submission**: 50 users for Level 5 and 70 total for Level 6. It does not assert Mainnet deployment or organizer acceptance. The [earlier broader challenge audit](docs/challenge/LEVELS_4_6_AUDIT.md) records a separate Mainnet requirement from the public program overview; it is not the basis of the Preprod checklist below.

**Status:** ✓ Evidence available and checked · ⚠ Partial evidence or reviewer/manual verification remains.

### Level 4 — Preprod MVP

| Requirement                                                  | Status | Evidence / how to verify                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working MVP live on Preprod with verifiable contract address | ✓      | [Live app](https://kairos-dapp.vercel.app), [contract address](#contract-address), [deployment/state evidence](docs/evidence/levels-4-6-verification.json), and [read-only verification command](#verify-the-finalized-deployment). Deployment is finalized with eight matching keys; current recorded state shows commitments and trading. A recorded full wallet/circuit flow with individual receipts remains unverified. |
| README, setup and usage documentation                        | ✓      | This README, [setup](#run-locally), [usage guide](docs/USAGE.md) and [onboarding](docs/ONBOARDING.md).                                                                                                                                                                                                                                                                                                                       |
| CI/CD pipeline running                                       | ✓      | [Workflow](.github/workflows/ci.yml) runs on main pushes and PRs; [Actions history](https://github.com/zaejohn/kairos-dapp/actions/workflows/ci.yml), [Vercel deployment guide](docs/DEPLOY_VERCEL.md). Running does not mean every run is green.                                                                                                                                                                            |
| Product X profile linked in README                           | ✓      | [https://x.com/usekairosdApp](https://x.com/usekairosdApp). The required link is present; signed-out profile/post visibility still needs review.                                                                                                                                                                                                                                                                             |
| Minimum 15 meaningful commits                                | ✓      | [64 published commits and milestone examples](#commit-history). The numeric threshold is exceeded; review the diffs to establish at least 15 meaningful commits.                                                                                                                                                                                                                                                             |
| Public GitHub repository                                     | ✓      | [zaejohn/kairos-dapp](https://github.com/zaejohn/kairos-dapp); GitHub API confirms public visibility.                                                                                                                                                                                                                                                                                                                        |
| Live demo                                                    | ✓      | [Open KAIROS](https://kairos-dapp.vercel.app); [recorded HTTP 200 checks](docs/evidence/levels-4-6-verification.json) cover the homepage, health and proving asset.                                                                                                                                                                                                                                                          |
| CI badge/workflow with passing runs                          | ✓      | Dynamic badge at the top; [latest fully successful run](https://github.com/zaejohn/kairos-dapp/actions/runs/36223626837) passed quality and e2e. [Newer main run](https://github.com/zaejohn/kairos-dapp/actions/runs/36227285212) failed e2e Compact installation; current main is not fully green.                                                                                                                         |
| Demo video                                                   | ✓      | [Owner-provided recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing). Public playback and coverage of the complete flow have not been verified; compare with the [demo checklist](docs/DEMO_CHECKLIST.md).                                                                                                                                                                         |

### Level 5 — 50 Preprod Users and Feedback

| Requirement                   | Status | Evidence / how to verify                                                                                                                                                                                                 |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Same MVP extended             | ✓      | Same [Compact contract](contracts/src/kairos.compact); [feedback-driven loading improvements](https://github.com/zaejohn/kairos-dapp/commit/50c0d6b) and [feedback-to-change mapping](docs/FEEDBACK.md#what-we-changed). |
| 50 verifiable Preprod users   | ✓      | **50 / 50** owner-confirmed real testers, source rows **2–51**; [spreadsheet](#user-and-feedback-evidence) and [validated roster](USERS.md). See the evidence boundary below.                                            |
| Feedback loop documented      | ✓      | [Collection method, raw comments, themes and implemented changes](docs/FEEDBACK.md); each improvement links its supporting CSV rows and commit.                                                                          |
| Updated documentation         | ✓      | [Documentation/evidence commit](https://github.com/zaejohn/kairos-dapp/commit/0324683), [usage](docs/USAGE.md), [feedback](docs/FEEDBACK.md), [proposal](PROPOSAL.md).                                                   |
| Minimum 20 meaningful commits | ✓      | [64 published commits and milestone examples](#commit-history); confirm at least 20 meaningful changes by inspecting their diffs.                                                                                        |
| Public repository             | ✓      | [GitHub repository](https://github.com/zaejohn/kairos-dapp).                                                                                                                                                             |
| Live demo                     | ✓      | [KAIROS on Preprod](https://kairos-dapp.vercel.app).                                                                                                                                                                     |
| 50 wallet addresses           | ✓      | [USERS.md](USERS.md): exactly 50 unique, SDK-validated Preprod unshielded addresses with dates; [row-aligned JSON](docs/evidence/user-feedback.json).                                                                    |
| Feedback evidence             | ✓      | [Source spreadsheet](#user-and-feedback-evidence), [Level 5 feedback log](docs/FEEDBACK.md#raw-feedback-log): 49 comments and one preserved blank.                                                                       |
| Demo video                    | ✓      | [Recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing); public playback and Level 5 coverage still need review.                                                                 |

### Level 6 — 70 Total Preprod Users

| Requirement                                  | Status | Evidence / how to verify                                                                                                                                                                               |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Same MVP extended                            | ✓      | Same product and contract; [loading improvements](https://github.com/zaejohn/kairos-dapp/commit/50c0d6b), [additional feedback and changes](docs/FEEDBACK.md#level-6-improvements).                    |
| 70 verifiable Preprod users                  | ✓      | **72 / 70 total**: 50 from CSV rows **2–51** plus 22 additional testers from rows **52–73**. [Level 5 roster](USERS.md) + [additional roster](LAUNCH_USERS.md); zero duplicate wallets across cohorts. |
| Feedback loop documented                     | ✓      | [Feedback themes and changes](docs/FEEDBACK.md#what-we-heard-themes), including additional-user row 66 reporting slow loading and the linked improvement commit.                                       |
| Updated documentation                        | ✓      | [Usage](docs/USAGE.md), [onboarding](docs/ONBOARDING.md), [feedback](docs/FEEDBACK.md), [brand brief](docs/BRAND.md) and this verification checklist.                                                  |
| Public repository                            | ✓      | [GitHub repository](https://github.com/zaejohn/kairos-dapp).                                                                                                                                           |
| Live demo                                    | ✓      | [KAIROS on Preprod](https://kairos-dapp.vercel.app).                                                                                                                                                   |
| 70 wallet addresses                          | ✓      | **72 unique validated addresses**, preserving all supplied evidence: [50 addresses](USERS.md) + [22 additional addresses](LAUNCH_USERS.md), [machine-readable rows](docs/evidence/user-feedback.json). |
| Feedback evidence                            | ✓      | [Source spreadsheet](#user-and-feedback-evidence); [complete feedback log](docs/FEEDBACK.md) contains 71 nonblank comments across the 72 testers.                                                      |
| Demo video                                   | ✓      | [Recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing); confirm it covers the submitted version and is publicly playable.                                     |
| Minimum 30 meaningful commits for submission | ✓      | [64 published commits and milestone examples](#commit-history); confirm at least 30 meaningful changes from their diffs before claiming completion.                                                    |

### User and Feedback Evidence

**Source spreadsheet:** [https://docs.google.com/spreadsheets/d/1SvYDOYWMjg3rMkskM7-g9qaayvnPohabXC1kBcVhWKA/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1SvYDOYWMjg3rMkskM7-g9qaayvnPohabXC1kBcVhWKA/edit?usp=sharing)

The owner confirms these are real testers. The public spreadsheet export matches all 72 records in [the sanitized evidence](docs/evidence/user-feedback.json). The [validator](scripts/verify-user-evidence.mjs) checks wallet checksum, Preprod network, unshielded address type, canonical encoding, dates, duplicate addresses and exact row alignment. Names and emails are not copied into the repository.

Counts establish real tester submissions with valid, distinct wallet addresses. The source contains no circuit transaction IDs or signed wallet-control attestations, so it does not independently prove a finalized transaction by each listed wallet. This boundary applies to both user-count rows above; any stricter organizer verification remains outstanding.

**Feedback → changes:** CSV rows 19, 24, 35 and 66 support optional entry while artwork loads; rows 19, 24, 35 and 40 support public-market loading status/retry. Both are implemented in [50c0d6b](https://github.com/zaejohn/kairos-dapp/commit/50c0d6b), with tests and a [full feedback mapping](docs/FEEDBACK.md#what-we-changed). Source publication is confirmed; the hosted deployment of these specific changes has not been independently checked.

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

`npm run verify` compiles, runs contract and application tests, lint and typecheck, validates the public evidence tables, and builds the app. The [latest fully successful CI run](https://github.com/zaejohn/kairos-dapp/actions/runs/36223626837) passed both quality and browser jobs at `d5bd45a`. The [newer quality job](https://github.com/zaejohn/kairos-dapp/actions/runs/36227285212/job/108363608540) passed at `8c74070`; its [e2e job](https://github.com/zaejohn/kairos-dapp/actions/runs/36227285212/job/108363937097) failed during Compact installation before tests ran. See the [CI workflow](.github/workflows/ci.yml), [test screenshot](docs/evidence/contract-tests.png), and [current local checks](docs/challenge/LEVELS_4_6_AUDIT.md).

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

## Usage, Feedback and Submission

Use the [usage guide](docs/USAGE.md) for wallet setup, the first transaction, verification and troubleshooting. Feedback about delays led to optional startup recovery and public-state loading/retry controls; [the feedback log](docs/FEEDBACK.md) maps the exact comments to changes. The improvements are published in GitHub; inclusion in the current hosted deployment has not been independently checked.

[Product proposal](PROPOSAL.md) · [https://x.com/usekairosdApp](https://x.com/usekairosdApp) · [launch/outreach drafts](docs/OUTREACH.md) · [full requirement audit and remaining actions](docs/challenge/LEVELS_4_6_AUDIT.md). Organizer proposal/category approval and public X posts remain owner-supplied evidence.

## Commit History

Published main has **64 commits** at [`8c74070`](https://github.com/zaejohn/kairos-dapp/commit/8c74070). Browse the [complete commit history](https://github.com/zaejohn/kairos-dapp/commits/main). Examples: [Compact contract](https://github.com/zaejohn/kairos-dapp/commit/7f5aee6), [contract tests](https://github.com/zaejohn/kairos-dapp/commit/db65b55), [wallet integration](https://github.com/zaejohn/kairos-dapp/commit/5e47e8c), [CI pipeline](https://github.com/zaejohn/kairos-dapp/commit/bff003e), [private signal market](https://github.com/zaejohn/kairos-dapp/commit/7315e2c), [quote economy](https://github.com/zaejohn/kairos-dapp/commit/905e685), and [deployment verification](https://github.com/zaejohn/kairos-dapp/commit/03e005b). Meaningful milestones are reviewed individually; total count alone is not proof of significance.

<details>
<summary>Existing compile, contract-test and deployment screenshots</summary>

![Compact compilation](docs/evidence/compact-compile.png)
![Twelve contract tests](docs/evidence/contract-tests.png)
![Preprod deployment verification](docs/evidence/preprod-deployment.png)

These are earlier captured evidence; dated current results are in the audit.

</details>
