# Kairos

**Private market conviction, public treasury rules, on Midnight Preprod.** Kairos is a quote-side signal market and contract-custodied trading prototype. Participants commit to a side without publishing it; a trusted resolver later proves the complete eight-position tally. The result sets a public treasury reserve target. Quote trades and treasury accounting are public.

## Quick links and current status

Evidence snapshot: **25 September 2026**, public `main` commit `9e80ea5`. Finalized transaction receipts provide the evidence for live circuit activity.

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
| CI                          | [Latest `main` run](https://github.com/zaejohn/kairos-dapp/actions/runs/36109085089): quality job passed; browser tests identified an intro-flow mismatch. An [earlier full run](https://github.com/zaejohn/kairos-dapp/actions/runs/36007235585) passed on `6359b53`. |
| Git history                 | **54 commits** on public `main` at the audited commit. [Examples of substantive milestones](#commit-history); commit significance is reviewed individually.                                                                                                            |

## Initial product idea

Kairos lets participants express a private weekly view on one of two quote sides. The Compact contract accepts eight salted commitments, verifies their openings in a later resolution proof, publishes the winning side, and applies a transparent 70/30 target to internal NIGHT redemption reserves. Participants initiate transactions, a trusted resolver sees the openings, and the current treasury target covers internal accounting.

## Product and user flow

1. A participant connects a compatible wallet on Preprod, chooses Quote A or B, downloads a private opening file, and submits its commitment before the public close time.
2. A trusted resolver receives **all eight** opening files privately. After close, the resolution circuit verifies each opening against its indexed public commitment and publishes the winner. A tie keeps the previous target. A missed round can expire after the resolution window.
3. Resolution or expiry applies the target to **internal** NIGHT redemption reserves. A separate call can restore the target after later trades; the next round starts only when the reserve split matches its target.
4. A one-time issuance circuit and public NIGHT/quote buy and sell circuits implement the contract-custodied token economy, fees, and bounded KAI trade incentive. Treasury actions append public accounting records.

The contract has compiled and local accounting/proving checks have passed. The deployment is independently verified; post-deployment circuit activity is a separate verification step. Public state reported `economyIssued: false` at this audit. Economic scope is contract-custodied trading and internal reserve accounting, with redemption limited by each side's available reserve. See [usage](docs/USAGE.md) and [capability boundaries](docs/research/PRODUCT_CAPABILITIES.md).

## Privacy model: public state vs private witness

| Data                                                                  | Who can learn it?                                            | What the circuit establishes                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Round time and phase; indexed commitment hashes and count             | Anyone reading the public ledger                             | A commitment is recorded before close.                                                                  |
| Individual side and random salt                                       | Participant; later the trusted resolver and its proof server | The commitment circuit uses them without writing them as public state.                                  |
| All eight openings                                                    | Trusted resolver and its proof server during resolution      | The resolution proof checks each opening against its public indexed commitment and computes the winner. |
| Winner, target, reserves, fees, token colors, treasury-action history | Anyone reading public state                                  | The contract applies its public accounting rules.                                                       |
| Trade side, amount, fee, and unshielded recipient                     | Anyone reading the public transaction                        | Trades are public.                                                                                      |

An on-chain observer sees each commitment's hash, index, and timing. The side and salt stay off the public ledger; resolution publishes the winner. This is **ledger privacy**. The resolver, its proof server, the participant's device, and recipients of an opening can learn the side. Timing and a small cohort can permit inference, and one wallet can submit several commitments. Keep opening files, local storage passwords, and wallet secrets private. See [the full privacy model](docs/product/PRIVACY_MODEL.md).

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

`npm run verify` compiles, runs contract and application tests, lint and typecheck, and builds the app. Its steps passed in the [latest quality job](https://github.com/zaejohn/kairos-dapp/actions/runs/36109085089/job/107988196838). The [browser job](https://github.com/zaejohn/kairos-dapp/actions/runs/36109085089/job/107988814967) records an intro-flow test mismatch: seven cases expect the workshop before **Enter the Garage**. Update the browser flow and confirm a passing run before adding a current-head CI badge. The [CI workflow](.github/workflows/ci.yml) and [test screenshot](docs/evidence/contract-tests.png) provide separate evidence.

The local `npm run proof:smoke` command checks and proves eight circuits with inputs against the local proof server. Use finalized Preprod receipts for wallet and network verification.

### Verify the finalized deployment

With generated artifacts present, run this **read-only** command:

```sh
npm run verify:preprod -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc
```

It queries the [Midnight Preprod indexer](https://indexer.preprod.midnight.network/api/v4/graphql), checks that the transaction deployed this exact address with final `SUCCESS`, and compares all eight deployed verifier keys with the local build. At this audit it returned block **2,686,941**, round **1**, phase **0**, and `economyIssued: false`. Current round and economy fields can change after future transactions.

### Verify an actual frontend circuit call

1. On the [public demo](https://kairos-dapp.vercel.app) in the browser profile with Preprod Lace, select **Enter the Garage**, then **Wallet** and connect Lace. In **Settings**, enter and **save** the local storage password, then confirm the local proof server. The wallet should show Preprod and the connected addresses/balance.
2. Open **Trading Engine** before the round close. Choose a side, prepare and download its opening file, acknowledge that it is saved, then submit the commitment and approve the wallet request. Keep the opening private.
3. Wait for a **finalized** receipt. Record its public transaction hash or identifier and refresh public state.
4. From the repository root, run:

   ```sh
   npm run verify:activity -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f <finalized-transaction-hash-or-identifier> commitPosition
   ```

   Replace the placeholder with the **circuit call's** finalized ID. The command must report a successful `commitPosition` call to this contract. Check that the public commitment count increased while the opening's side and salt remain private. A circuit call verifies activity, while participant counts require separate evidence.

5. To demonstrate a complete round, obtain eight openings in public index order through a private channel, resolve within the one-day window after close, and verify the `resolveRound` transaction and new public target. For the economic extension, verify `initializeEconomy`, `buyQuote`/`sellQuote`, and `rebalanceTreasury` **separately** with their own finalized receipts and public-state changes. See [the detailed usage guide](docs/USAGE.md).

This evidence snapshot links the finalized deployment. Add each independently verified post-deployment circuit receipt as it becomes available.

## Level-by-level submission checklist

The statuses below apply to this evidence snapshot. **Implemented** identifies code or local checks; **verified** identifies the linked evidence for a specific result. Level completion follows verification of every requirement.

### Level 1

| Requirement                                                                | Evidence / status                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public repository, README, setup, initial idea, public/private explanation | [Public repository](https://github.com/zaejohn/kairos-dapp); sections above. **Verified.**                                                                                                                                                                                                             |
| Toolchain, Compact compile, passing tests                                  | Pinned toolchain, [compile screenshot](docs/evidence/compact-compile.png), [12 passing contract tests](docs/evidence/contract-tests.png), and [latest quality job](https://github.com/zaejohn/kairos-dapp/actions/runs/36109085089/job/107988196838). **Screenshots captured; CI quality job passed.** |
| Generated `managed/` circuits and keys                                     | Created by `npm run compact:compile`; present locally and **ignored in Git**. Confirm whether reproducible generation meets the submission format.                                                                                                                                                     |
| Preview/Preprod deployment and visible address                             | Preprod address/hash above; read-only verifier returned `SUCCESS` and eight matching keys. [Deployment screenshot](docs/evidence/preprod-deployment.png) shows the address and `SUCCESS`. **Verified.**                                                                                                |
| At least 5 meaningful commits                                              | 54 total commits at audited public `main`; [milestone examples](#commit-history). **Count verified; significance requires review.**                                                                                                                                                                    |

**Compile evidence:** Compact compiler 0.31.1 completed one contract, listed all eight circuits, and generated their verifier keys.

![Terminal output showing Kairos Compact compilation and eight circuit names](docs/evidence/compact-compile.png)

**Deployment evidence:** The read-only Preprod verifier reports the deployed address, transaction hash, `SUCCESS` in block 2,686,941, and eight current artifact circuits.

![Terminal output verifying the Kairos Preprod deployment address and successful transaction](docs/evidence/preprod-deployment.png)

### Level 2

| Requirement                                                      | Evidence / status                                                                                                                                                                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lace connect/disconnect                                          | [Wallet implementation](src/lib/midnight/wallet.ts) and [frontend](src/components/kairos-app.tsx) exist; owner reported successful connection. Next evidence: recorded approval and disconnect. |
| Successful frontend circuit call and observable privacy behavior | Commitment/resolution circuits and local tests exist; public witness boundary is explained above. Next evidence: a finalized Preprod `commitPosition` call.                                     |
| Preprod contract, public demo, privacy claim                     | Verified deployment above; [public demo](https://kairos-dapp.vercel.app) loads without sign-in; privacy section above. Live wallet activity has a separate verification step.                   |
| At least 8 meaningful commits                                    | 54 total; [history](#commit-history). **Count verified; significance requires review.**                                                                                                         |

### Level 3

| Requirement                                                      | Evidence / status                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional privacy dApp, at least 3 passing tests                | Eight-circuit app, [test screenshot](docs/evidence/contract-tests.png) showing **12 passing contract tests**, and [latest quality job](https://github.com/zaejohn/kairos-dapp/actions/runs/36109085089/job/107988196838). Live circuit verification follows the steps above. |
| CI workflow with passing runs                                    | [Workflow](.github/workflows/ci.yml) and [earlier full passing run](https://github.com/zaejohn/kairos-dapp/actions/runs/36007235585). Next evidence: a passing run for the updated browser flow.                                                                             |
| Approved idea from provided list / submitted product proposal    | [PROPOSAL.md](PROPOSAL.md) has owner fields to complete; add the submission and approval record when received.                                                                                                                                                               |
| Public README/demo/privacy explanation and 10 meaningful commits | Links and sections above, including the [demo recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing); 54 total commits at the audited public `main`. Commit significance and live functionality are reviewed against evidence.       |

**Test evidence:** The local Vitest contract suite completed with 12 passing tests in one test file. Live Preprod activity uses separate transaction receipts.

![Terminal output showing 12 passing Kairos contract tests](docs/evidence/contract-tests.png)

### Level 4

| Requirement                                 | Evidence / status                                                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Level 3 eligibility and working Preprod MVP | Public app and deployed contract are verified. Next evidence: finalized circuit and economic transactions, plus idea approval.            |
| Full documentation, live link, CI           | This README, [usage](docs/USAGE.md), [Vercel guide](docs/DEPLOY_VERCEL.md), and public demo exist. Next evidence: updated browser CI run. |
| Product X profile                           | [X Profile](https://x.com/usekairosdApp)                                                                                                  |
| At least 15 meaningful commits              | 54 total at audited public `main`; [history](#commit-history). **Count verified; significance requires review.**                          |

### Level 5

| Requirement                         | Evidence / status                                                                                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same Level 4 MVP, extended          | Token economy, trading, reserve restoration, and treasury history are implemented and locally checked. Record their finalized Preprod calls for live verification.                                                                |
| Updated documentation and live demo | This README, [public demo](https://kairos-dapp.vercel.app), and [demo recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing) are linked. Add independently verified transaction receipts. |
| At least 20 meaningful commits      | 54 total at audited public `main`; [history](#commit-history). **Count verified; significance requires review.**                                                                                                                  |

The [challenge brief](docs/challenge/LEVELS_1_5.md) also calls for user activity and feedback evidence. [USERS.md](USERS.md) currently records **0/50 verified wallet interactions**; [docs/FEEDBACK.md](docs/FEEDBACK.md) has the feedback record. Verify participants and responses individually before updating those counts.

## Commit history

The public `main` branch had **54 commits** at `9e80ea5`. Examples: [Compact contract](https://github.com/zaejohn/kairos-dapp/commit/7f5aee6), [contract tests](https://github.com/zaejohn/kairos-dapp/commit/db65b55), [wallet integration](https://github.com/zaejohn/kairos-dapp/commit/5e47e8c), [CI pipeline](https://github.com/zaejohn/kairos-dapp/commit/bff003e), [private signal market](https://github.com/zaejohn/kairos-dapp/commit/7315e2c), [quote economy](https://github.com/zaejohn/kairos-dapp/commit/905e685), and [Preprod deployment verification](https://github.com/zaejohn/kairos-dapp/commit/03e005b). The total includes scaffolding and maintenance; commit significance is reviewed individually.

## Next submission steps

1. **Confirm updated CI.** Update the browser tests for **Enter the Garage**, run `npm run test:e2e`, push the change, and confirm that the newest `main` quality and browser jobs both pass. Add a current-head CI badge after that run.
2. **Review the evidence images.** The three images in `docs/evidence/` are tracked in Git. Confirm they render in the public README from a signed-out browser. Keep passwords, opening files, and wallet secrets private.
3. **Link a verified circuit receipt.** Follow [the live verification steps](#verify-an-actual-frontend-circuit-call), run `verify:activity` against `commitPosition`, and add the finalized transaction link. Review the [owner-provided recording](https://drive.google.com/file/d/1-Tv1BLNPHblSF-TebN8ALZhJ1BJGgMad/view?usp=sharing) for the wallet connection, finalized result, and disconnect sequence.
4. **Submit the proposal.** Complete [PROPOSAL.md](PROPOSAL.md), select a category from the challenge's idea list or obtain an explicit exception, and record the submission and approval evidence.
5. **Confirm public profile access.** Open the X Profile link above in a signed-out browser and confirm it is viewable.
6. **Collect Level 5 user evidence.** With consent, verify finalized Preprod interactions and wallet control, distinguish repeat activity from distinct participants, and update [USERS.md](USERS.md) and [docs/FEEDBACK.md](docs/FEEDBACK.md) with real feedback and linked improvements.
7. **Publish the updated README.** Review the links, commit and push the documentation, then reopen the public README and demo in a signed-out browser.

For deployment changes or a replacement contract, follow [DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) and pair each address with its finalized deployment and matching verifier keys.
