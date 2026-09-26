# KAIROS Level 4–6 requirement audit

## Sources and scope

- Official [Rise In program](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight) and [program overview](https://www.risein.com/blog/new-moon-to-full-rise-in-and-midnight-introduce-a-builder-path-for-privacy-first-dapps), checked this audit. The overview identifies an idea-approval gate, Level 4 Preprod MVP/docs/CI/X profile, Level 5 feedback and 50 Preprod users, and Level 6 Mainnet launch/iteration/brand assets/20 users after launch.
- The repository's [detailed Levels 1–5 brief](LEVELS_1_5.md) supplies additional submission-format checks. It is a supplied reference, not an instruction to redeploy or fabricate approval. No detailed official Level 6 submission form was available in the repository.
- The original response CSV is authoritative for real tester submissions. The owner confirms these people tested KAIROS. [Sanitized row evidence](../evidence/user-feedback.json) and [validation script](../../scripts/verify-user-evidence.mjs) preserve/check the requested cohorts without publishing names or emails.
- The [live verification snapshot](../evidence/levels-4-6-verification.json) records current CI, HTTP checks and public ledger state. Current published CI is distinct from local changes awaiting publication.

## Level 4

| Requirement                                               | Status | Evidence or remaining action                                                                                                                                                                                           |
| --------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product proposal and approval before Level 4              | ✓      | [Proposal](../../PROPOSAL.md) now describes the implementation. Owner review, category acceptance and organizer approval record remain.                                                                                |
| MVP deployed on Preprod                                   | ✓      | Address below; deployment `SUCCESS`, block 2,686,941, all eight verifier keys match a fresh compile.                                                                                                                   |
| Compact public/private boundaries and minimum three tests | ✓      | Eight circuits; 12 contract tests passed. [Privacy model](../product/PRIVACY_MODEL.md) explains resolver/proof-server access and public trades.                                                                        |
| Frontend wallet/circuit/loading/error flow                | ✓ / ⚠ | Implemented and browser-tested; current chain state corroborates commitments and trading. A fresh recorded real-wallet flow with individual finalized circuit receipts remains to be attached.                         |
| Current production build                                  | ✓      | `npm run build` passed locally on Node 22.23.3.                                                                                                                                                                        |
| Live demo                                                 | ✓      | [KAIROS](https://kairos-dapp.vercel.app), health, robots, sitemap and commitment verifier asset all returned HTTP 200 without authentication.                                                                          |
| CI/CD and correct badge                                   | ✓      | [Latest main run 36223626837](https://github.com/zaejohn/kairos-dapp/actions/runs/36223626837), SHA `d5bd45afcfac5e696e556722d198089b7ac389f8`, quality and e2e successful. README has a dynamic main-branch CI badge. |
| README contract table, setup, stack and usage             | ✓      | [README](../../README.md), [USAGE](../USAGE.md), and retained reproducible `contracts/managed/kairos` / `public/zk/kairos` generation. Generated files remain ignored as before.                                       |
| Public product X profile                                  | ✓      | [@usekairosdApp](https://x.com/usekairosdApp) is linked. X returned HTTP 403 to the audit browser; owner must verify signed-out visibility and link published launch posts.                                            |
| Demo video and launch posts                               | ✓      | Existing owner-supplied video linked in README; content/completeness and public permissions unverified. [Capture checklist](../DEMO_CHECKLIST.md) and [post drafts](../OUTREACH.md) prepared.                          |
| At least 15 meaningful commits (detailed local brief)     | ✓ / ⚠ | Published main contains 61 commits; README links substantive contract, wallet, test and CI milestones. Individual significance remains reviewer judgment. No padding commits created.                                  |

## Level 5

| Requirement                                           | Status | Evidence or remaining action                                                                                                                                                                                                  |
| ----------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continue the same MVP                                 | ✓      | Existing product, wallet/provider flow and Compact source preserved. No redeployment.                                                                                                                                         |
| 50 real Preprod users                                 | ✓      | [USERS.md](../../USERS.md): exactly CSV rows 2–51, 50 valid unique Preprod unshielded wallet addresses and valid dates. Real testing is owner-confirmed.                                                                      |
| Feedback log and collection method                    | ✓      | [FEEDBACK.md](../FEEDBACK.md): all 50 row-aligned entries, 49 actual comments and one explicit blank at CSV row 31.                                                                                                           |
| Two or three justified improvements                   | ✓      | Two changes: optional startup recovery while artwork loads; public-state loading/retry in Trading Engine. CSV rows 19, 24, 35, 40 and 66 support the delay theme. No measured speedup or invented feature request is claimed. |
| Updated README/docs/live link                         | ✓      | README, usage, onboarding and feedback mapping updated. Hosted demo still needs the new local changes published.                                                                                                              |
| At least 20 meaningful commits (detailed local brief) | ✓ / ⚠ | Same published 61-commit history and substantive milestones; final acceptance belongs to the reviewer.                                                                                                                        |
| Eligibility/submission acceptance                     | ✓      | Level 4 approval/public-profile/demo evidence above and owner submission remain.                                                                                                                                              |

## Level 6

| Requirement                         | Status | Evidence or remaining action                                                                                                                                                                                   |
| ----------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requested additional Preprod roster | ✓      | [LAUNCH_USERS.md](../../LAUNCH_USERS.md): all 22 rows 52–73 preserved, **22 / 20**, no duplicates within or across cohorts.                                                                                    |
| Feedback-based iteration            | ✓      | 22 additional comments recorded; row 66 reinforces the delay theme addressed by both changes. Automated tests cover the changes.                                                                               |
| Brand assets/materials              | ✓ / ⚠ | Existing logo/artwork plus [brand brief](../BRAND.md), 120-character X bio, palette and banner concept. Owner must export/upload the banner and publish brand materials.                                       |
| Onboarding and demo materials       | ✓      | [ONBOARDING.md](../ONBOARDING.md), [USAGE.md](../USAGE.md), [DEMO_CHECKLIST.md](../DEMO_CHECKLIST.md). Recording is manual.                                                                                    |
| Official Mainnet deployment         | ✗      | This application and configuration are Preprod-only. No Mainnet address or deployment evidence exists. The explicit task keeps the existing Preprod deployment; no Mainnet migration/deployment was attempted. |
| 20 users after Mainnet launch       | ✗      | The additional 22 are real Preprod testers. They cannot be presented as post-Mainnet-launch users. Obtain the Mainnet evidence, or a written organizer exception before claiming this requirement.             |

**Level 6 is not complete under the published official requirements.** A Preprod roster or a banner concept cannot establish a Mainnet launch.

## Deployment and current activity

| Item                                    | Value                                                              |
| --------------------------------------- | ------------------------------------------------------------------ |
| Network                                 | Preprod                                                            |
| Contract                                | `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f` |
| Deployment transaction hash             | `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc` |
| Final status / block                    | `SUCCESS` / 2,686,941                                              |
| Matching current compiled verifier keys | 8 / 8                                                              |
| Current round / phase / commitments     | 1 / 1 (full, awaiting close) / 8                                   |
| Round closes                            | 1 October 2026, 08:41:43 UTC (public ledger timestamp)             |
| Economy issued                          | true                                                               |
| Reserves A / B                          | 9,075 / 6,975 atomic NIGHT                                         |
| Fee pool / KAI distributed              | 505 / 505                                                          |
| Treasury action count                   | 0                                                                  |

These are dated public-state observations; they can change. State corroborates issuance, commitments and trading, but supplies neither the individual transaction hashes nor a mapping to CSV users/frontend sessions. Resolution/expiry/restoration are not yet reflected in treasury history. No contract code changed during this audit. Fresh compilation and verifier-key matching support retaining the current deployment; no source-hash provenance record is claimed.

Recheck deployment without a wallet:

```sh
npm run verify:preprod -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc
```

## Local verification

| Check                                                | Result                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Pinned Compact compile                               | ✓ 0.31.1; eight circuits generated                                                                     |
| Contract tests                                       | ✓ 12                                                                                                   |
| Application/component tests                          | ✓ 36                                                                                                   |
| Activity verifier / Vercel env / user evidence tests | ✓ 5 / 6 / 4                                                                                            |
| Typecheck / ESLint                                   | ✓ Both pass, zero lint warnings                                                                        |
| Production build                                     | ✓ Pass                                                                                                 |
| Chromium Playwright                                  | ✓ 11, including slow-artwork entry, public-state retry, mobile and mocked wallet flows                 |
| Original CSV vs sanitized evidence                   | ✓ Exact source hash and row comparison; 72 valid distinct addresses; valid dates; 71 nonblank comments |
| Live deployment verification                         | ✓ SUCCESS, eight matching keys                                                                         |

Existing Vite config-loader and generated sourcemap/module-type warnings remain non-failing. Browser tests emitted the existing logo loading hint and Midnight local-storage notice. Browser wallet flows use mocks and do not establish real extension approval. Local checks do not replace CI for the new commit after publication.

The new refresh action retries initial pending or failed public reads. Like the existing Settings refresh, a manual read has no application timeout; a stalled manual request can remain busy until the network settles. No general hung-network recovery or faster proving is claimed.

## Exact remaining owner actions

1. Review [PROPOSAL.md](../../PROPOSAL.md), submit/confirm the selected challenge category, and attach the organizer approval record.
2. Review and publish the local commits to `main` when ready (`git push origin main` if working on `main`), then confirm the new Actions run and Vercel deployment. This audit does not push or publish.
3. Verify the [X profile](https://x.com/usekairosdApp) while signed out, publish the three reviewed [launch posts](../OUTREACH.md), and upload the logo/banner.
4. Retrieve public circuit transaction hashes from existing wallet receipts/history and verify each with `npm run verify:activity -- <contract-address> <hash-or-identifier> <circuit-name>`. Record a fresh demo using [the checklist](../DEMO_CHECKLIST.md). Round 1 is full and closes October 1; resolution needs all eight private openings and the public deadline. After the one-day resolution window, expiry is available if required. Do not redeploy merely to bypass the round.
5. For official Level 6, obtain written organizer clarification if Preprod is intended to be accepted instead of the published Mainnet requirement. Otherwise plan and review a Mainnet migration separately, deploy through the approved wallet/operator flow, then collect 20 real users after launch. No safe Mainnet deploy command exists in this Preprod-only repository.
6. Submit the repository, current demo/video and evidence links to Rise In. Keep the original CSV/private consent records outside Git; provide any additional wallet-control or activity proof the organizer requests privately.
