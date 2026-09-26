# Kairos Levels 1–5 evidence status

## Current status — 2026-09-26

The [Levels 4–6 requirement audit](LEVELS_4_6_AUDIT.md) supersedes the historical snapshot below. Latest published main CI is green at `d5bd45a`; live demo endpoints return HTTP 200; deployment verification matches eight current compiled keys. The authoritative CSV provides 50 Level 5 real testers and 22 additional real Preprod testers with validated distinct addresses and 71 nonblank comments. Two feedback-backed loading improvements pass local checks. Public state shows eight commitments, issued economy and trading balances. Organizer approval, public X/video review, circuit receipt links and official Level 6 Mainnet/post-launch user evidence remain separate requirements.

## Historical snapshot — 2026-09-24

Checked on 2026-09-24. This records requirements from `LEVELS_1_5.md`; local checks are distinct from Preprod and public submission evidence.

| Level | Evidence established | Still required for challenge completion |
| --- | --- | --- |
| 1 | Compact 0.31.1 compiled eight Kairos circuits; twelve contract tests passed; the local proof server generated proofs for all eight with synthetic inputs. The current eight-circuit contract is finalized on Preprod at `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f`, hash `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc`, block 2,686,941; all deployed verifier keys match. | Owner-provided manual screenshots; meaningful milestone history and public repository evidence. |
| 2 | Responsive frontend, wallet connector, provider transaction path and local progress states, clear-local-session flow, privacy explanation, and seven Playwright flows passed earlier. The owner reports 1AM connection and Lace deployment now proceed; the Lace deployment is independently finalized on Preprod. | Successful **circuit call** observed on Preprod; public demo URL; manual demo video; meaningful commit evidence. |
| 3 | Twelve contract, twenty-four application unit, four read-only transaction verifier, and seven Playwright tests passed locally. CI workflow compiles, tests, typechecks, lints, and builds; local production build passed. `PROPOSAL.md` has the owner-requested placeholders. | Hosted passing CI run/badge and public demo; owner's proposal answers; organizer confirmation that Kairos fits the allowed category or explicit exception; meaningful commit evidence. |
| 4 | Usage guide, market, trading, reserve, KAI incentive, public treasury action history, and local position-file preview are prepared. Issuance, trade, and atomic internal allocation circuits compile; the current contract is deployed on Preprod. | Level 3 proposal approval first; actual Preprod circuit flow; public demo, X profile/posts, manual video; real economic transactions and external liquidity path; meaningful commit evidence. |
| 5 | `USERS.md`, feedback log, outreach drafts, and README validation section are prepared. | Level 4 eligibility and public demo, 50 independently verified wallet interactions with consent, actual feedback and improvements, owner-led outreach and meaningful commit evidence. |

No Level is marked complete. The deployment is a verified transaction of the current eight-circuit build; no post-deployment circuit call, token issuance, trade, or reserve action has been verified. The Codex in-app browser lacks an injected wallet, so the owner's report is the evidence for the wallet approval experience. No user, feedback, organizer approval, hosted CI run, or public Vercel deployment is inferred from the contract deployment.
