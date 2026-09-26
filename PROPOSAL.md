# Product Proposal

## What is the product, and who uses it?

KAIROS is a private quote-side signal market with public treasury accounting on Midnight. Participants commit a weekly market view without publishing its side or salt. A trusted resolver collects all eight openings privately and proves the result; the contract applies the resulting reserve target. Participants, community treasury operators and reviewers can inspect the public policy and accounting.

## Why Midnight specifically?

Compact circuits verify private commitment openings and the complete eight-position tally while keeping individual sides and salts off the public ledger. A transparent implementation that publishes the openings would reveal each position. Midnight lets the public verify the result and reserve rules while a participant shares their opening only with the trusted resolver and its proof server. This is ledger privacy, not privacy from the resolver; token trades remain public.

## Data Model

| Data Point | Type | Disclosed To |
| --- | --- | --- |
| Indexed position commitment | Public ledger | Everyone |
| Position side and salt | Private circuit input | Participant; later trusted resolver and its proof server |
| Winning quote side and allocation target | Public ledger | Everyone |
| Quote A, Quote B, and KAI token colors and issuance status | Public ledger | Everyone |
| Contract-mediated trade side, amount, fee, and unshielded recipient | Public transaction | Everyone |
| NIGHT side reserves, fee pool, fee schedule, and KAI distributed total | Public ledger | Everyone |

The precise trust and inference boundaries are documented in [PRIVACY_MODEL.md](docs/product/PRIVACY_MODEL.md).

## Mainnet Feasibility

The current release is Preprod-only. A Mainnet release is not ready to claim: it needs an explicit network/provider migration, matching compiler and ledger compatibility checks, a contract/security review, realistic wallet/proof and token-economy validation, and operator-approved deployment. The resolver receives every opening; missing openings can prevent resolution, with expiry as recovery. Reserve accounting is internal, there is no external liquidity venue, and KAI does not promise redemption or yield. No Mainnet address or launch date is asserted.

## Challenge approval

This proposal reflects the implemented product. Organizer approval and category acceptance have not been supplied. The owner must review and submit it, and retain the approval link or record before claiming the Level 4 eligibility prerequisite.
