# Codex + Midnight Production Boilerplate

A single full-stack **Next.js 16** application prepared for Codex-driven, multi-agent development on Midnight Network.

The repository is intentionally opinionated: small scoped instructions, bounded subagents, evidence-first changes, deterministic verification, safe Git behavior, and a pinned Midnight compatibility surface.

## Stack

- Next.js 16.3.6, App Router, React 19, TypeScript, Tailwind CSS 4
- Node.js 22
- Midnight Network
- Compact toolchain 0.31.1 / language 0.23
- Midnight.js 4.1.1
- DApp Connector API 4.0.1
- Proof server 8.1.0
- Lace wallet
- Vitest + Testing Library
- Playwright
- GitHub Actions

## Start

```bash
cp .env.example .env.local
npm install
npm run agent:doctor
npm run dev
```

Open `http://localhost:3000` and use **Connect Lace** in a browser where Lace is installed.

## Midnight setup

Install Compact devtools, then pin the compiler line used by the current public-network compatibility matrix:

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.5.1/compact-installer.sh | sh
compact update 0.31
compact compile --version
```

Start the local proof server:

```bash
npm run proof:up
npm run proof:status
```

Compile every contract in `contracts/src/`:

```bash
npm run compact:compile
```

Generated Compact artifacts go to `contracts/managed/` and are intentionally ignored by Git.

## Verification

Fast local gate:

```bash
npm run verify:fast
```

Full application gate:

```bash
npm run verify
```

Browser gate:

```bash
npx playwright install chromium
npm run test:e2e
```

For a Compact change, also run:

```bash
npm run compact:compile
npm run test:contracts
npm run proof:status
```

## Codex operating model

Codex reads `AGENTS.md` from the repository root and applies narrower `AGENTS.md` files as it enters scoped directories. Project-local agent configuration lives in `.codex/`, while reusable workflows live in `.agents/skills/`.

The default rule is **one writer, multiple readers**. Subagents are used for independent exploration, verification, documentation lookup, and bounded work—not as a default for every task.

Read these first:

- `AGENTS.md` — repository-wide operating contract
- `docs/agent/OPERATING_MODEL.md` — orchestration and model-selection rules
- `docs/engineering/DEFINITION_OF_DONE.md` — completion gate
- `docs/midnight/WORKFLOW.md` — Compact, proof server, wallet, and privacy workflow
- `docs/architecture/ARCHITECTURE.md` — application boundaries
- `docs/research/DESIGN_BASIS.md` — researched alternatives and why this architecture was chosen

## Durable long-running state

For work that spans many steps, keep concise state in:

- `docs/agent/STATE.md`
- `docs/agent/TASKS.md`

Do not dump terminal logs or full research transcripts there. Store only decisions, evidence references, blockers, completed verification, and the next concrete step.

## Git policy

Codex may create commits autonomously after a coherent milestone is green. It must not push, force-push, rewrite shared history, run destructive cleanup, or discard user changes unless explicitly instructed.

Use Conventional Commits and keep commits reversible and logically scoped.

## Important Midnight security defaults

- Treat all values written to ledger/public outputs as public.
- Never use a proof server you do not control for private witness data.
- Never log private state, seeds, secrets, full wallet payloads, or proving inputs.
- Never treat `ownPublicKey()` or any unconstrained witness result as trusted authentication.
- Do not edit generated Compact artifacts by hand.
- Verify version-sensitive Midnight APIs against the official docs and the compatibility matrix before implementation.

## Replace the demo contract

`contracts/src/hello-world.compact` is deliberately tiny and stores a public message. It exists only to prove the compile pipeline. Replace it with the project contract and add contract-specific tests before shipping real functionality.
