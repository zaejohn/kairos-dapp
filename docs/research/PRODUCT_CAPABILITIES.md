# Kairos capability and limitation record

Research checked on 2026-09-23 against the [Midnight compatibility matrix](https://docs.midnight.network/relnotes/support-matrix): Compact compiler 0.31.1/language 0.23, runtime 0.16.0, Midnight.js 4.1.1, DApp Connector API 4.0.1, proof server 8.1.0. Source and local compiler/tests are evidence for the design; no Preprod transaction has been observed in this checkout.

## Implemented boundary

- Eight public indexed commitments per round. Each is a hash of the round, side, and random 32-byte salt. The circuit inputs for side and salt are private; the commitment, count, transaction, and timing are public.
- Submission asserts the opening file's expected round equals the contract's current round, so a saved opening cannot silently land in a later round.
- A resolver supplies all eight openings to one proof. The contract checks every opening and discloses only the winning side, then writes a 70/30 quote-side target. A tie preserves the previous target. The contract does not move assets.
- Anyone can submit multiple positions and start the next round after resolution. The contract does not enforce weekly timing or unique humans. Opening files are not recoverable from the chain.
- The resolver and its proof server see every opening. The dedicated proof server is bound to loopback port 6301. [Midnight's security guide](https://docs.midnight.network/guides/security-best-practices) treats public ledger writes and transaction timing as observable and prover-supplied values as untrusted for authentication.

## Intended economic boundary

The [Fantastical Factory reference](https://docs.fantasticalfactory.com/) informs the intended recurring three-token, asymmetric-friction, fee-funded incentive loop; its Solana mechanics are not ported as Midnight features. [Midnight's unshielded token guide](https://docs.midnight.network/tokens/unshielded-token) documents native issuance/transfers. A contract-mediated route could apply different buy and sell fees, but direct wallet-to-wallet transfers bypass that route. Kairos therefore cannot promise a token-wide transfer tax.

Unshielded minting has a [reported Compact ledger-partitioning failure](https://github.com/LFDT-Minokawa/compact/issues/235) when combined with fallible operations. That report conflicts with an owner-gated mint example in the official guide. Three-token issuance and swaps must be separately compiled, tested, and observed on Preprod before integration or product claims. No supported external liquidity venue/counterparty path was verified, so the target is policy only; automatic liquidity reallocation is not claimed. No fee route or reserve exists, so rewards are unavailable.

## Upgrade boundaries

Keep market participation, resolution, policy, and future execution separate. A later token module must prove issuance and balances on Preprod. A later trading module must enforce reserve conservation and charge fees only on contract-mediated trades. A treasury executor must demonstrate a real venue and authenticated authority before moving funds. Keep the UI and README scoped to the behavior actually verified at each stage.
