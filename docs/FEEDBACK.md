# User Feedback — Level 5

## Feedback Collection Method

Google Form responses supplied by the owner in `KAIROS (Responses) - Form Responses 1.csv`. The owner confirms that these are real testers. Rows 2–51 form Level 5; rows 52–73 form the additional Level 6 Preprod cohort. Public identifiers map to the numbered wallet rows in [USERS.md](../USERS.md) and [LAUNCH_USERS.md](../LAUNCH_USERS.md). Names and emails are not published.

The [sanitized source evidence](evidence/user-feedback.json) preserves the exact feedback text, source row, local timestamp and wallet. It includes the original CSV SHA-256. Dates below are normalized without assuming a timezone. There are 49 nonblank comments among the 50 Level 5 entries and 22 among the 22 additional entries.

## Raw Feedback Log

Feedback is transcribed verbatim. CSV row 31 has no comment; the empty field remains empty in the JSON.

| # | User | Feedback Summary | Date |
|---|------|------------------|------|
| 1 | L5-1 (CSV 2) | Cool app | 2026-09-25 |
| 2 | L5-2 (CSV 3) | Looks good | 2026-09-25 |
| 3 | L5-3 (CSV 4) | Nice UI | 2026-09-25 |
| 4 | L5-4 (CSV 5) | Pretty nice | 2026-09-25 |
| 5 | L5-5 (CSV 6) | Very clean | 2026-09-25 |
| 6 | L5-6 (CSV 7) | Feels smooth | 2026-09-25 |
| 7 | L5-7 (CSV 8) | Good design | 2026-09-26 |
| 8 | L5-8 (CSV 9) | I like it | 2026-09-26 |
| 9 | L5-9 (CSV 10) | Looks nice | 2026-09-26 |
| 10 | L5-10 (CSV 11) | Very cool | 2026-09-26 |
| 11 | L5-11 (CSV 12) | Nice animation | 2026-09-26 |
| 12 | L5-12 (CSV 13) | Good navigation | 2026-09-26 |
| 13 | L5-13 (CSV 14) | So cool | 2026-09-26 |
| 14 | L5-14 (CSV 15) | Very smooth | 2026-09-26 |
| 15 | L5-15 (CSV 16) | Looks great | 2026-09-26 |
| 16 | L5-16 (CSV 17) | Nice style | 2026-09-26 |
| 17 | L5-17 (CSV 18) | Fast for me | 2026-09-26 |
| 18 | L5-18 (CSV 19) | Loading little long for me maybe because my internet is slow | 2026-09-26 |
| 19 | L5-19 (CSV 20) | Good UI | 2026-09-26 |
| 20 | L5-20 (CSV 21) | Works good | 2026-09-26 |
| 21 | L5-21 (CSV 22) | Clean design | 2026-09-26 |
| 22 | L5-22 (CSV 23) | Very fast | 2026-09-26 |
| 23 | L5-23 (CSV 24) | Little loading slow but maybe problem from my network | 2026-09-26 |
| 24 | L5-24 (CSV 25) | Nice work | 2026-09-26 |
| 25 | L5-25 (CSV 26) | Good app | 2026-09-26 |
| 26 | L5-26 (CSV 27) | Easy to use | 2026-09-26 |
| 27 | L5-27 (CSV 28) | Looks polished | 2026-09-26 |
| 28 | L5-28 (CSV 29) | Fast enough | 2026-09-26 |
| 29 | L5-29 (CSV 30) | Good flow | 2026-09-26 |
| 30 | L5-30 (CSV 31) | [No feedback supplied] | 2026-09-26 |
| 31 | L5-31 (CSV 32) | Works fast | 2026-09-26 |
| 32 | L5-32 (CSV 33) | Nice animations | 2026-09-26 |
| 33 | L5-33 (CSV 34) | So clean | 2026-09-26 |
| 34 | L5-34 (CSV 35) | Had small delay | 2026-09-26 |
| 35 | L5-35 (CSV 36) | No issue | 2026-09-26 |
| 36 | L5-36 (CSV 37) | Modern UI | 2026-09-26 |
| 37 | L5-37 (CSV 38) | Smooth animation | 2026-09-26 |
| 38 | L5-38 (CSV 39) | Very nice | 2026-09-26 |
| 39 | L5-39 (CSV 40) | Processing was little long for me maybe my internet not stable | 2026-09-26 |
| 40 | L5-40 (CSV 41) | Good overall | 2026-09-26 |
| 41 | L5-41 (CSV 42) | Looks cool | 2026-09-26 |
| 42 | L5-42 (CSV 43) | Nice experience | 2026-09-26 |
| 43 | L5-43 (CSV 44) | Premium feel | 2026-09-26 |
| 44 | L5-44 (CSV 45) | Easy interface | 2026-09-26 |
| 45 | L5-45 (CSV 46) | Clean app | 2026-09-26 |
| 46 | L5-46 (CSV 47) | Fast app | 2026-09-26 |
| 47 | L5-47 (CSV 48) | Really nice | 2026-09-26 |
| 48 | L5-48 (CSV 49) | Loads fast | 2026-09-26 |
| 49 | L5-49 (CSV 50) | Easy flow | 2026-09-26 |
| 50 | L5-50 (CSV 51) | Very simple | 2026-09-26 |

## What We Heard (Themes)

- Most comments praise the visual design, animations, simplicity or responsiveness. Keep the Garage design and normal cinematic entry.
- Level 5 CSV rows 19, 24, 35 and 40 report loading or processing delays. Several testers explicitly say their network may be responsible; these are not measured performance results.
- Level 6 CSV row 66 repeats the slow-loading concern. The remaining 21 Level 6 comments are positive.
- No comment asks for a new financial feature, a privacy redesign or a contract change.

## What We Changed

| Change | Reason | Commit |
|--------|--------|--------|
| Optional startup recovery after eight seconds waiting for artwork, with honest loading text | CSV 19, 24, 35 and 66: loading delays; an unresolved image decode previously hid the only entry button indefinitely | [50c0d6b](https://github.com/zaejohn/kairos-dapp/commit/50c0d6b) (local; awaiting push) |
| Public-state loading explanation and a direct refresh button in Trading Engine; late responses cannot replace a newer read | CSV 19, 24, 35 and 40: distinguish a pending public read from an unavailable market and make recovery accessible | [50c0d6b](https://github.com/zaejohn/kairos-dapp/commit/50c0d6b) (local; awaiting push) |

These are targeted responses to the reported delays, not a claim that the comments identify a specific root cause or that network/proof times became faster. Existing transaction stage messages remain in place.

## Level 6 Feedback Log

| # | User | Feedback Summary | Date |
|---|------|------------------|------|
| 1 | L6-1 (CSV 52) | Nice one | 2026-09-26 |
| 2 | L6-2 (CSV 53) | So nice | 2026-09-26 |
| 3 | L6-3 (CSV 54) | Pretty fast | 2026-09-26 |
| 4 | L6-4 (CSV 55) | Cool animations | 2026-09-26 |
| 5 | L6-5 (CSV 56) | Clean looking | 2026-09-26 |
| 6 | L6-6 (CSV 57) | Loads quickly | 2026-09-26 |
| 7 | L6-7 (CSV 58) | Smooth overall | 2026-09-26 |
| 8 | L6-8 (CSV 59) | Nice transition | 2026-09-26 |
| 9 | L6-9 (CSV 60) | Easy enough | 2026-09-26 |
| 10 | L6-10 (CSV 61) | Fast response | 2026-09-26 |
| 11 | L6-11 (CSV 62) | Modern look | 2026-09-26 |
| 12 | L6-12 (CSV 63) | Simple app | 2026-09-26 |
| 13 | L6-13 (CSV 64) | Smooth app | 2026-09-26 |
| 14 | L6-14 (CSV 65) | Clean UI | 2026-09-26 |
| 15 | L6-15 (CSV 66) | Loading little slow | 2026-09-26 |
| 16 | L6-16 (CSV 67) | Love it | 2026-09-26 |
| 17 | L6-17 (CSV 68) | Cool one | 2026-09-26 |
| 18 | L6-18 (CSV 69) | Nice app | 2026-09-26 |
| 19 | L6-19 (CSV 70) | Responsive | 2026-09-26 |
| 20 | L6-20 (CSV 71) | Pretty cool | 2026-09-26 |
| 21 | L6-21 (CSV 72) | Small animations nice | 2026-09-26 |
| 22 | L6-22 (CSV 73) | Smooth experience | 2026-09-26 |

## Level 6 Improvements

| Change | User Feedback That Triggered It | Status |
|--------|---------------------------------|--------|
| Startup artwork recovery and clearer entry status | L6-15, CSV row 66: “Loading little slow”; also Level 5 rows 19, 24 and 35 | Implemented; component and Chromium checks passed in `50c0d6b`; awaiting publication |
| Public market loading status and read-only retry in Trading Engine | CSV row 66 reinforces the earlier slow-loading reports; row 40 mentions slow processing | Implemented; component and Chromium checks passed in `50c0d6b`; awaiting publication |

## Reproduce the Evidence Audit

```sh
node scripts/verify-user-evidence.mjs "path/to/KAIROS (Responses) - Form Responses 1.csv"
node --test tests/node/user-evidence.test.mjs
```

The first command compares the private original with the published sanitized evidence and fails on altered row order, invalid dates, duplicate/invalid addresses or mismatched output. It does not print names, emails, or raw records. Keep the original CSV outside Git.
