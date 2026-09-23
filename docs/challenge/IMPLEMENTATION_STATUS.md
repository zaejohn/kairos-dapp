# Kairos Levels 1–5 evidence status

Checked on 2026-09-24. This records requirements from `LEVELS_1_5.md`; local checks are distinct from Preprod and public submission evidence.

| Level | Locally evidenced | Still required for challenge completion |
| --- | --- | --- |
| 1 | Compact 0.31.1 compiled eight Kairos circuits; ten contract tests passed; the local proof server generated proofs for all eight with synthetic inputs; generated `contracts/managed/kairos` is present locally; README describes the idea and privacy boundary. | Finalized Preview/Preprod deployment and visible address; owner-provided manual screenshots; meaningful milestone history and public repository evidence. |
| 2 | Responsive frontend, Lace connector code, provider transaction path, clear-local-session flow, privacy explanation, and three Playwright flows passed. | Lace connection and successful circuit transaction observed on Preprod; verified address and public demo URL; manual demo video; meaningful commit evidence. |
| 3 | Ten contract, seventeen unit, and three Playwright tests passed locally. CI workflow compiles, tests, typechecks, lints, and builds; local production build passed. `PROPOSAL.md` has the owner-requested placeholders. | Hosted passing CI run/badge and public demo; owner's proposal answers; organizer confirmation that Kairos fits the allowed category or explicit exception; meaningful commit evidence. |
| 4 | Usage guide, market, trading, reserve, and KAI interface and local economic contract tests are prepared. Issuance, trade, and allocation circuits compile. | Level 3 proposal approval first; actual Preprod deployment and circuit flow; public demo, X profile/posts, manual video; real economic transactions and external liquidity path; meaningful commit evidence. |
| 5 | `USERS.md`, feedback log, outreach drafts, and README validation section are prepared. | Level 4 eligibility and public demo, 50 independently verified wallet interactions with consent, actual feedback and improvements, owner-led outreach and meaningful commit evidence. |

No Level is marked complete. A funded Lace wallet was reported by the owner, but the Codex in-app browser available during this check lacked an injected Lace extension. No contract address, user, feedback, approval, hosted CI run, or deployment was inferred from local tests.
