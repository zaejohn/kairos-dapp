# KAIROS

> Private conviction. Collective signal. Autonomous treasury rebalancing.

A confidential, self-rebalancing DeFi treasury built on Midnight. Participants
privately express conviction on whether Token A or Token B should receive the
treasury's liquidity. The market resolves, and the protocol automatically
reallocates toward the winning side. An asymmetric flip tax returns protocol
revenue to the treasury, funding the next market.

```
Private conviction → Market resolution → Treasury reallocation
        → Flip activity → Treasury tax revenue → Next market
```

---

## Contract Address

**Not yet deployed.** KAIROS has not been deployed to a public network, so there
is no address to report — and no address is invented here.

Deploying requires a browser wallet (Lace) holding testnet tNIGHT plus DUST for
fees. Everything else is in place: the contract compiles, all seven circuits
produce proving keys, and the test suite runs against the real compiled
artifacts. See [Deployment](#deployment) for the exact steps and what to expect.

Once deployed, set the address and the app will pick it up:

```sh
NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS=<address> npm run build
```

---

## What This Does

A protocol owns a treasury split between two assets. Instead of a committee or a
token vote deciding the split, KAIROS runs a repeated decision market asking one
question:

> Should the next treasury allocation favor Token A or Token B?

**The loop.**

1. **Private conviction.** A participant picks a side and a conviction weight.
   The browser derives a commitment and a per-market nullifier from those values
   and submits only the two hashes. The side and weight stay private.
2. **Market resolution.** The market closes, participants reveal, and the
   revealed weights form a public tally per side.
3. **Treasury reallocation.** The side with more conviction wins. The treasury's
   target allocation advances 20 percentage points toward it, capped at 90%.
4. **Flip.** Anyone can convert treasury reserves between A and B.
5. **Tax.** Each flip skims a directional tax — 1% A→B, 3% B→A — retained by the
   treasury as revenue.
6. **Next market.** Tallies reset; allocation, reserves and collected tax carry
   forward.

**Treasury rule.** The winning side advances one fixed 2000 bps step; the loser
takes exactly the remainder, so `allocA + allocB == 10000` holds by construction
rather than by a check afterwards. Starting from a balanced treasury:

```
Before:   A = 50%   B = 50%
A wins
After:    A = 70%   B = 30%
```

A tie reallocates nothing and resolves to `NONE` — the treasury is never tilted
on a coin flip.

**Asset accounting.** Treasury reserves are **clearly labelled demo units** and
represent no real asset. The flip is a 1:1 protocol-controlled accounting
operation, not a swap; integrating a real AMM is explicitly out of MVP scope.
The architecture — reserves, directional tax, treasury accounting — is the real
one; only the asset itself is not.

---

## Privacy Model

Privacy comes from the Compact contract, not from the frontend. While a market
is open the only things on-chain are two preimage-resistant hashes.

| Data Point | Type | Disclosed To |
|---|---|---|
| Market id, market state, winner | `Uint<64>`, enums | Public |
| Treasury allocation A / B | `Uint<64>` bps (`A + B == 10000`) | Public |
| Treasury reserves A / B | `Uint<64>` demo units | Public |
| Flip tax rates, tax revenue | `Uint<64>` bps / demo units | Public |
| Commitment | `Bytes<32>` hash | Public — reveals nothing about side or weight |
| Nullifier | `Bytes<32>` hash | Public — replay guard, unlinkable across markets |
| Revealed tallies, position count | `Uint<64>` | Public |
| **Position side** | witness `Uint<64>` | **Private while OPEN; disclosed at reveal** |
| **Conviction weight** | witness `Uint<64>` | **Private while OPEN; disclosed at reveal** |
| **Commitment salt** | witness `Bytes<32>` | **Private — never disclosed** |
| **Participant secret** | witness `Bytes<32>` | **Private — never disclosed** |

### The privacy claim

> **A user can privately express market conviction while the protocol verifies
> valid participation and uses the market result to determine treasury
> allocation.**

### What an observer can and cannot learn

- **Can learn:** that a wallet submitted a commitment; how many commitments were
  filed; and, after reveals, the side and weight that were revealed.
- **Cannot learn:** which side a participant backed or how much conviction they
  attached, while the market is open.

### What is deliberately *not* claimed

KAIROS does **not** provide transaction-level anonymity, hidden balances, hidden
transaction history, or invisible on-chain activity. Submitting a position is a
visible transaction from a visible wallet. What is hidden is the *content* of
the position during the open phase, not the fact of participation.

### Honest limitation: commit-reveal, not commit-forever

Side and weight are private while the market is `OPEN` and become public at
reveal, because the tally that decides the market must be computable from public
state. The salt and secret are never disclosed, and the nullifier folds in the
market id so a participant's positions in different markets do not link through
it. **Unrevealed positions are not counted.**

---

## Tech Stack

**Application** — Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind
CSS v4. One full-stack Next.js app; no separate backend service.

**Midnight** — Compact 0.23 (`compact compile` toolchain 0.31.1), midnight-js
4.1.1, Midnight DApp Connector 4.0.1, Lace wallet, `midnightntwrk/proof-server`
8.1.0.

Package versions are pinned to the official support matrix, **not** npm's
`latest` tag. Several packages' `latest` is ahead of what the deployed networks
have been tested against — `compact-runtime` in particular resolves to `0.19.0`
while the tested version is `0.16.0`, which is what the compiled contract
actually reports. See `managed/kairos/compiler/contract-info.json`.

---

## Prerequisites

- **Node.js 22**
- **Docker**, for the proof server
- **Compact toolchain 0.31.1**
- **Lace wallet**, for deployment and interaction
- **Lace set to a local proof server** (Settings → Midnight → Local)

> The Compact compiler ships Linux and macOS binaries only. On Windows, run the
> compile steps inside WSL2.

Install the Compact toolchain:

```sh
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
compact update 0.31.1
```

Start the proof server (leave it running):

```sh
docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
```

The first run downloads public proving parameters (a few hundred MB, once).

---

## Setup

```sh
npm install

# Compile the contract and publish the ZK assets the browser fetches.
npm run compile
npm run zk:sync

# Development server
npm run dev
```

Then open <http://localhost:3000> and connect Lace.

### Scripts

| Script | Purpose |
|---|---|
| `npm run compile` | Compile `contracts/kairos.compact` into `managed/kairos` |
| `npm run zk:sync` | Copy prover/verifier keys and zkir into `public/zk` for browser fetching |
| `npm run build:contract` | Both of the above |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Contract test suite |

`managed/` is committed rather than gitignored: the browser needs the proving
keys at runtime, so a checkout without it cannot run the app. CI recompiles from
source and diffs against the committed tree to prevent drift.

---

## Run Tests

```sh
npm test
```

**83 tests** across three files.

`tests/kairos.test.ts` (44 tests) runs the real compiled circuits through the
Compact runtime simulator — the same artifacts that ship to the browser. No
proof server is required, so the suite is fast and deterministic while still
enforcing the circuit logic, assertions and disclosure rules.

`tests/reliability.test.ts` (33 tests) covers the lifecycle as an exhaustive
transition matrix — every (state, circuit) pair is asserted, so each transition
has a defined outcome rather than only the ones we thought to test — plus long
adversarial sequences, rejected-transition side-effect freedom, and the
presentation arithmetic.

`tests/proving.e2e.test.ts` (6 tests) covers the proving infrastructure: every
circuit has a loadable, non-empty zkir and key pair; the combined key material
the proof provider requests resolves; the compiler provenance recorded in
`contract-info.json` matches the pinned runtime; and a real proof server is
reachable and running the expected version. These skip automatically when no
proof server is listening.

**What the test suite does not verify: proof generation itself.** Proving a
circuit call needs a fully-formed ledger transaction (a real `ZswapChainState`
and contract address), which in practice comes from a deployed contract. That
step is verified by deployment — see [Deployment](#deployment). This is called
out explicitly because it would be easy to fake: a test that proves a *deploy*
transaction looks like it verifies proving, but a deploy carries verifier keys
onto the chain and contains no circuit proof, so it passes without the proof
server ever being contacted.

Coverage:

- **Initialisation** — determinism, the allocation invariant, tax configuration
- **Private submission** — no side or weight reaches public state; commitments
  are hiding and binding; invalid sides and out-of-range weights are rejected
- **Replay protection** — one position per secret per market; replays that
  change side or weight are rejected; the same secret works again next market
- **Lifecycle** — no submission after close, no reveal before close, no
  settlement before close, no double settlement, no finalize before settle, no
  next market before finalize
- **Reveal** — correct tally, no double reveal, no reveal without a commitment,
  and tampering with side, weight or nonce is rejected
- **Treasury** — the 50/50 → 70/30 example, invariant preserved across repeated
  settlements, ties and empty markets reallocate nothing, saturation at the 90%
  ceiling and recovery back down
- **Asymmetric tax** — 1% A→B vs 3% B→A, revenue accumulation, demo-value
  conservation, bad direction / zero amount / over-sized flips rejected
- **Full economic loop** — end to end, with treasury carried into the next market

---

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

1. Node.js 22
2. Compact toolchain, pinned to 0.31.1
3. `npm ci`
4. Contract compilation
5. **Artifact verification** — every circuit must have a non-empty prover key,
   verifier key and zkir
6. **Reproducibility check** — recompile from source and diff against the
   committed artifacts, so `managed/` cannot silently drift from the contract
7. Typecheck, contract tests, ZK asset sync, Next.js production build

---

## Deployment

Deployment must be done from a browser, because Lace's DApp Connector is the
supported path and it holds the keys.

1. Start the proof server (above) and set Lace to **Settings → Midnight → Local**.
2. Get testnet tNIGHT from the Preprod faucet and wait for DUST to accumulate —
   without DUST, the deploy transaction cannot pay fees.
3. Run the app, connect Lace, and click **Deploy KAIROS contract**.
4. Wait for the proof and confirmation. The new address is shown in the footer.
5. Set `NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS` to that address and rebuild.

---

## Project Structure

```
kairos/
├── contracts/kairos.compact     # the protocol
├── managed/kairos/              # compiled artifacts (committed)
├── src/
│   ├── app/                     # Next.js App Router
│   ├── components/              # treasury, market, position, flip, privacy panels
│   ├── hooks/useKairos.ts       # wallet + contract + ledger state
│   └── lib/
│       ├── contract/            # bindings, witnesses, simulator
│       ├── midnight/            # network config, wallet, providers
│       └── shims/               # build shims
├── tests/kairos.test.ts         # 44 contract tests
├── public/zk/                   # ZK assets served to the browser
├── docs/USAGE.md                # user guide
├── PROPOSAL.md                  # product proposal
└── .github/workflows/ci.yml
```

---

## Initial Idea

KAIROS began from a simple observation: **treasury allocation votes leak
strategy.**

If positions are public, a large holder's side and weight are visible before the
market resolves. That invites front-running, discourages honest signalling from
smaller participants, and turns the mechanism into a game of following the
whale. The information a decision market produces is valuable precisely because
it aggregates independent judgement — and publishing each input destroys the
independence that makes the aggregate worth having.

The insight that shaped the design is that you do not need to hide *everything*
to fix this. You need to hide the inputs while the market is forming, and
disclose only what the result requires. That is exactly what commitments and
nullifiers are for, and it is exactly the shape of problem Midnight's private
witnesses with selective disclosure are built for.

So KAIROS commits to positions rather than publishing them. While the market is
open the chain holds two hashes per participant and nothing else. When the
market closes, participants reveal, and the tally that decides the treasury's
allocation becomes something anyone can verify.

The treasury mechanism follows from the same instinct: make the rule mechanical
so there is nothing to lobby. The winning side advances a fixed step; the loser
takes the remainder; the invariant holds by construction. The asymmetric flip
tax is what makes the loop self-funding rather than a drain — moving into B
costs three times what moving into A costs, so the treasury earns from the
activity it enables.

The result is a confidential DeFi primitive that is honest about its own
boundaries: it hides conviction while conviction is being expressed, it discloses
what the outcome requires, and it never claims to hide more than it does.

---

## Further Reading

- [`docs/USAGE.md`](docs/USAGE.md) — plain-English user guide
- [`PROPOSAL.md`](PROPOSAL.md) — product proposal, data model, mainnet feasibility
- [`contracts/kairos.compact`](contracts/kairos.compact) — the protocol, with the
  public/private/disclosed model documented in the header
