# Product Proposal

## What is the product, and who uses it?

KAIROS is a **confidential, self-rebalancing DeFi treasury**.

A protocol owns a treasury split between two quote-side assets — Token A and
Token B. Rather than letting a committee or a token vote decide the split,
KAIROS runs a repeated decision market that asks one question:

> Should the next treasury allocation favor Token A or Token B?

Participants express conviction privately. When the market resolves, the
treasury moves deterministically toward the winning side. A protocol-controlled
flip converts between the two reserves, skimming an asymmetric directional tax
that accrues back to the treasury, and the next market opens with the treasury
carried forward.

```
Private conviction → Market resolution → Treasury reallocation
        → Flip activity → Treasury tax revenue → Next market
```

**Who uses it.** Three groups, with different needs:

- **Treasury participants** — token holders or contributors who have a view on
  which asset the treasury should hold. They want their conviction to influence
  allocation without publishing their strategy. A public vote on treasury
  allocation is a signal everyone can front-run and copy; a private one is not.
- **The protocol itself** — which gets a mechanical, non-discretionary
  reallocation rule that cannot be lobbied between votes, plus a revenue stream
  from flip activity.
- **Observers and auditors** — who can verify every state transition, the
  allocation invariant and the tax arithmetic from public state alone, without
  learning any individual's position while a market is open.

**Why privacy is the point, not a feature.** Treasury allocation votes leak
strategic intent. If positions are public, a large holder's side and weight are
visible before the market resolves, which invites front-running, discourages
honest signalling from smaller participants, and turns the mechanism into a
follow-the-whale game. KAIROS makes the conviction itself private and discloses
only what the market result requires.

---

## Why Midnight specifically?

Three properties, each of which the protocol actually uses:

1. **Private witnesses with selective disclosure.** Compact's `witness`
   declarations let the contract consume side, weight and salt without them ever
   entering public state, and `disclose()` forces every value that *does* leave
   the private domain to be marked deliberately. The compiler rejects
   undeclared disclosure — during development it refused to compile until each
   witness-derived value written to the ledger was explicitly disclosed. That is
   a much stronger guarantee than a convention of "be careful what you log".

2. **On-chain verification of private claims.** The contract asserts that the
   weight is in range and that `side ∈ {A, B}` inside the circuit. Those checks
   are proven in zero knowledge: a participant demonstrates valid participation
   without revealing what they participated with. On a transparent chain the same
   check would require publishing the value being checked.

3. **Commitments and nullifiers as first-class primitives.** The replay guard is
   a nullifier derived from a secret and the market id, and the position is a
   hiding commitment. Both are ordinary hashing over Compact's standard library
   — no invented cryptography — and both are exactly the primitives Midnight is
   designed around.

The alternative — publishing positions and relying on the client to hide them —
does not achieve the goal. Privacy that comes from the frontend is not privacy;
the chain state would still contain the answer.

---

## Data Model

Everything below is the actual implementation, not a design sketch. "Public"
means it is an `export ledger` field readable by anyone; "Private" means it is a
witness that exists only inside the participant's browser during proof
generation.

| Data Point | Type | Disclosed To |
|---|---|---|
| Market id | `Uint<64>` | Public — identifies the market; folded into nullifiers |
| Market state | `MarketState` enum (OPEN/CLOSED/SETTLED/FINALIZED) | Public |
| Treasury allocation A / B | `Uint<64>` basis points | Public — invariant `A + B == 10000` |
| Treasury reserves A / B | `Uint<64>` demo units | Public |
| Flip tax rates A→B, B→A | `Uint<64>` basis points | Public |
| Tax revenue A / B | `Uint<64>` demo units | Public — cumulative |
| Commitment | `Bytes<32>` hash | Public — reveals nothing about side or weight |
| Nullifier | `Bytes<32>` hash | Public — replay guard, unlinkable across markets |
| Revealed marker | `Uint<64>` (market id) | Public |
| Revealed tallies A / B | `Uint<64>` | Public — the market result |
| Position count | `Uint<64>` | Public — how many commitments were filed |
| Winner | `Side` enum (NONE/A/B) | Public |
| Last rebalance size | `Uint<64>` basis points | Public |
| **Position side** | `Uint<64>` witness (0 = A, 1 = B) | **Private while OPEN; disclosed at reveal** |
| **Conviction weight** | `Uint<64>` witness | **Private while OPEN; disclosed at reveal** |
| **Commitment salt (nonce)** | `Bytes<32>` witness | **Private — never disclosed** |
| **Participant secret** | `Bytes<32>` witness | **Private — never disclosed** |

### The disclosure boundary, stated plainly

KAIROS is **commit-reveal**. While a market is `OPEN`, the only things that reach
the chain are two preimage-resistant hashes, so neither the side nor the weight
is recoverable from chain state. When the market moves to `CLOSED`, participants
reveal so the tally that decides the market can be computed from public state.

This is a deliberate trade, and the honest framing is:

- **Private during the market:** side, weight, salt, secret.
- **Public at reveal:** side and weight. Required for the result.
- **Never public:** salt and secret. They are only ever inputs to the hash
  comparison, and both remain private even after a reveal.
- **Unlinkable across markets:** the nullifier folds in the market id, so the
  same participant's positions in different markets do not connect through it.

An observer learns that *a* commitment was filed and, after reveals, the side
and weight that were revealed. An observer cannot learn who backed what while
the market is open.

### What is deliberately *not* claimed

KAIROS does not claim transaction-level anonymity, hidden balances, hidden
transaction history, or that on-chain activity is invisible. Submitting a
position is a visible transaction from a visible wallet; what is hidden is the
*content* of the position during the open phase, not the fact of participation.
Unrevealed positions do not count toward the tally and are simply dropped.

---

## Mainnet Feasibility

**What already works.** The contract compiles against Compact toolchain 0.31.1
(compiler 0.31.1, language 0.23.0, runtime 0.16.0 — the versions the official
support matrix lists for preprod, preview and mainnet alike). All seven circuits
produce prover and verifier keys, and the artifacts are reproducible: a clean
recompile is byte-identical to the committed output, which CI enforces.
The 44 contract tests run the real circuits through the Compact runtime.

**What is required to go live.**

1. **Deployment.** The contract must be deployed from a funded wallet. Every
   other prerequisite is in place; this is the one step that needs a wallet
   holding testnet tNIGHT plus DUST for fees, and it must be done from a browser
   because Lace's DApp Connector is the supported path.
2. **A proof server.** Proof generation runs locally at `http://localhost:6300`
   (`midnightntwrk/proof-server:8.1.0`). This is the supported configuration —
   Lace only offers a local proof server — and it is also the right one
   architecturally, since witness data must not be sent to a third party.
3. **An indexer.** Public state is read from the network indexer at
   `/api/v4/graphql`. No additional infrastructure is needed.

**Honest limitations.**

- **Demo asset accounting.** Treasury reserves are labelled demo units and
  represent no real asset. Wiring real tokens would mean integrating a DEX or
  AMM for the flip, which the MVP scope deliberately excludes: the flip is a
  1:1 protocol-controlled accounting operation, not a swap. The architecture —
  reserves, directional tax, treasury accounting — is the real one; only the
  asset itself is not.
- **Proving cost.** Every state transition generates a proof. Close, settle,
  finalize and next-market are cheap; position submission and reveal involve
  more witness work. On a busy market this is a real UX consideration, and
  batching reveals would be the natural next optimisation.
- **Compact has no integer division.** Division is delegated to a witness and
  then re-verified on-chain (`r < y`, `q * y + r == x`, plus a `q <= x` bound
  that rules out modular wrap-around). This is the officially documented
  workaround, and the verification means a dishonest witness fails proof
  generation rather than corrupting treasury accounting — but it is a workaround,
  and native integer division in Compact would remove it.
- **Ties.** A tied market reallocates nothing and resolves to `NONE`. This keeps
  the outcome deterministic for every possible tally pair rather than
  arbitrarily favouring a side.

**Assessment.** The protocol is mainnet-shaped: the privacy model is enforced by
the compiler rather than by convention, the treasury invariant is structural
rather than checked after the fact, and the artifacts are reproducible. The
remaining gap is deployment and real-asset plumbing, not protocol design.
