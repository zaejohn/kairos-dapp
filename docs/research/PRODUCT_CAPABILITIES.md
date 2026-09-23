# Kairos capability and limitation record

Research checked on 2026-09-24 against the [Midnight compatibility matrix](https://docs.midnight.network/relnotes/support-matrix): Compact compiler 0.31.1/language 0.23, runtime 0.16.0, Midnight.js 4.1.1, DApp Connector API 4.0.1, proof server 8.1.0. Source and local compiler/tests are evidence for the design; no Preprod transaction has been observed in this checkout.

## Implemented boundary

- Eight public indexed commitments per round. Each is a hash of the round, side, and random 32-byte salt. The circuit inputs for side and salt are private; the commitment, count, transaction, and timing are public.
- Submission asserts the opening file's expected round equals the contract's current round, so a saved opening cannot silently land in a later round.
- A resolver supplies all eight openings to one proof. The contract checks every opening and discloses only the winning side, then writes a 70/30 quote-side target. A tie preserves the previous target. Resolution itself does not move assets.
- Anyone can submit multiple positions and start the next round after resolution. The contract does not enforce weekly timing or unique humans. Opening files are not recoverable from the chain.
- The resolver and its proof server see every opening. The dedicated proof server is bound to loopback port 6301. [Midnight's security guide](https://docs.midnight.network/guides/security-best-practices) treats public ledger writes and transaction timing as observable and prover-supplied values as untrusted for authentication.

## Locally compiled economic boundary

The [Fantastical Factory reference](https://docs.fantasticalfactory.com/) informs the three-token, asymmetric-friction loop; its Solana mechanics are not ported as Midnight features. [Midnight's unshielded token guide](https://docs.midnight.network/tokens/unshielded-token) documents native issuance/transfers. The pinned compiler accepts fixed-supply contract-custodied genesis for Quote A, Quote B, and KAI; NIGHT/quote buy and sell calls; public basis-point fees; and a conditional KAI distribution coupled to the fee. Seven local contract tests pass, including exact fee and reserve invariants. The local proof server checked and generated proofs for all seven exported circuits with synthetic inputs. The tests explicitly supply settled unshielded balances between circuit calls; they do not model a full Preprod transaction or Lace balancing.

Unshielded minting has a [reported Compact ledger-partitioning failure](https://github.com/LFDT-Minokawa/compact/issues/235) when combined with fallible operations. Genesis contains no assert and later calls cannot inflate supply, but no transaction has been submitted and finalized on Preprod. A real wallet transaction is required before claiming issuance or trade runtime success. Direct wallet-to-wallet transfers bypass Kairos routes and fees. KAI is a fixed-supply trade incentive, not a claim on fees or NIGHT; the public fee pool has no withdrawal route.

After resolution, a separate public call mathematically constrains an internal split of NIGHT redemption capacity to the target percentage. The next round cannot start until the current split matches the target, including after intervening trades. This affects which side can redeem; it does not move external liquidity or guarantee a side can redeem after capacity moves away. No supported external liquidity venue/counterparty path was verified. Weekly timing and autonomous transaction submission are not implemented, so the operator must submit round and allocation calls.

## Upgrade boundaries

Keep market participation, resolution, policy, and execution separate. Before expanding economic claims, verify mint, trade, reserve, and KAI transactions on Preprod with their public balances. A treasury executor must demonstrate a real venue and authenticated authority before moving external liquidity. Keep the UI and README scoped to the behavior actually verified at each stage.
