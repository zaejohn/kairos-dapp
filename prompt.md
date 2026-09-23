# KAIROS — Midnight Builder Challenge

Build **KAIROS** from an empty repository into a polished, working Midnight Confidential DeFi dApp.

The target is to complete the technical implementation required across **Levels 1–5** of the Midnight Builder Challenge.

---

# 1. PRODUCT

## KAIROS

KAIROS is a **confidential, self-rebalancing DeFi treasury**.

Users privately express conviction on whether **Token A** or **Token B** should receive the treasury's liquidity.

The market resolves, and the protocol automatically reallocates treasury liquidity toward the winning side.

An asymmetric flip tax sends protocol revenue back to the treasury.

Core loop:

```text
Private conviction
        ↓
Market resolution
        ↓
Treasury reallocation
        ↓
Flip activity
        ↓
Treasury tax revenue
        ↓
Next market
```

Example:

```text
Treasury before:

A = 50%
B = 50%

Private market:

A wins

Treasury after:

A = 70%
B = 30%
```

## Product concept is fixed

Do not replace KAIROS with another product.

Do not turn it into:

- a generic prediction market,
- a full DEX,
- a generic DAO,
- a lending protocol,
- an unrelated privacy application.

Keep the implementation centered on the KAIROS mechanism.

---

# 2. THREE-TOKEN MODEL

### Token X

Core protocol / reserve token.

### Token A

Quote-side asset A.

### Token B

Quote-side asset B.

The treasury primarily manages allocation between Token A and Token B.

For the MVP, keep the economic model intentionally simple.

Do not add unnecessary:

- tokenomics,
- yield strategies,
- external liquidity providers,
- exchange integrations,
- cross-chain functionality,
- oracle infrastructure.

Use real Midnight-supported assets when practical.

If real asset handling would add unnecessary complexity for the current SDK, use clearly labeled test/demo accounting while preserving the intended protocol architecture.

Never represent simulated balances as real assets.

---

# 3. DECISION MARKET

Each market asks:

> **Should the next treasury allocation favor Token A or Token B?**

Users submit private positions.

Conceptually:

```text
Private:
- side
- conviction / weight
- nonce / nullifier material
- private witness data

Public:
- market ID
- market status
- settlement state
- information required for the final result
```

The exact implementation must follow the current Midnight privacy model.

Do not invent cryptographic mechanisms.

Do not invent Midnight APIs.

---

# 4. MARKET LIFECYCLE

The contract must enforce:

```text
OPEN
  ↓
POSITION SUBMISSION
  ↓
CLOSED
  ↓
SETTLEMENT
  ↓
REBALANCED
  ↓
FINALIZED
```

For the MVP, market progression may be deterministic and manually triggered.

Do not require real-time scheduling infrastructure.

Prevent:

- position submission after close,
- settlement before close,
- double settlement,
- invalid state transitions,
- replayed positions.

---

# 5. TREASURY

Use a deterministic treasury allocation rule.

Example:

```text
Before:

A = 50%
B = 50%

A wins

After:

A = 70%
B = 30%
```

The exact rule may differ, but it must be:

- deterministic,
- contract-enforced,
- easy to explain,
- represented with safe integer arithmetic.

Maintain the allocation invariant.

For example:

```text
A + B = 100%
```

or an equivalent integer representation.

Never use floating-point arithmetic inside contract financial calculations.

---

# 6. ASYMMETRIC FLIP TAX

Implement configurable directional taxes.

Example:

```text
A → B = 1%
B → A = 3%
```

A flip must:

1. validate the operation,
2. determine direction,
3. calculate the tax,
4. apply the net amount,
5. account for the tax in the treasury.

Do not build a complete DEX or AMM.

A simple protocol-controlled flip mechanism is sufficient.

---

# 7. PRIVACY MODEL

Privacy is a core protocol feature.

It must come from the actual Midnight implementation rather than frontend hiding.

## Private

Where supported by the actual implementation:

- individual market position,
- exact conviction / weight,
- private witnesses,
- nonce/salt material,
- unnecessary user-linked strategy information.

## Public

The protocol may expose:

- market ID,
- market state,
- winner,
- treasury allocation,
- settlement state,
- required commitments/nullifiers,
- non-sensitive protocol state.

Core privacy claim:

> **A user can privately express market conviction while the protocol verifies valid participation and uses the market result to determine treasury allocation.**

Do not claim:

- complete anonymity,
- hidden blockchain activity,
- hidden balances,
- hidden transaction history,

unless the actual implementation provides those properties.

The documentation must accurately describe:

- what is public,
- what is private,
- what is intentionally disclosed,
- what an observer can learn,
- what an observer cannot learn.

---

# 8. CORE USER FLOW

The application must support:

```text
Connect Lace
      ↓
View Treasury
      ↓
Join Active Market
      ↓
Select A or B privately
      ↓
Submit Private Position
      ↓
Close Market
      ↓
Settle Market
      ↓
View Winner
      ↓
View Treasury Reallocation
      ↓
Flip A/B
      ↓
Apply Asymmetric Tax
      ↓
Tax Returns to Treasury
      ↓
Next Market
```

This must use real Midnight contract interaction.

Do not replace core protocol behavior with frontend-only simulation.

---

# 9. HARNESS — CLAUDE CODE + DEEPSEEK

You are operating inside **Claude Code with DeepSeek as the model provider**.

Optimize for a long-running autonomous coding session.

Use this loop continuously:

```text
Inspect
→ Understand
→ Plan
→ Implement
→ Run
→ Inspect output
→ Fix
→ Re-run
→ Verify
```

## Rules

- Work directly in the repository.
- Do not switch model/provider.
- Do not ask me to perform coding tasks.
- Inspect before modifying.
- Use tools aggressively when they reduce uncertainty.
- Verify your own work.
- Continue through ordinary coding errors.
- Use subagents only when they provide meaningful value.
- Do not spawn unnecessary subagents.
- Do not stop at the first error.
- Do not assume success because code exists.

Only stop for a genuine external blocker such as a required wallet action, credential, or other operation that cannot safely be performed autonomously.

When blocked, complete all independent work first.

---

# 10. MIDNIGHT SOURCE OF TRUTH

Use the **current official Midnight documentation** as the source of truth.

Use the Midnight Docs MCP when available.

Before using any version-sensitive Midnight functionality, inspect the current documentation.

This includes:

- Compact syntax,
- private state,
- `disclose()`,
- commitments,
- nullifiers,
- generated artifacts,
- Midnight.js,
- DApp Connector,
- Lace,
- network configuration,
- deployment,
- proof server,
- SDK APIs.

Do not rely on remembered Midnight APIs.

If an example from memory conflicts with the current documentation, follow the current documentation.

---

# 11. EMPTY REPOSITORY

The repository is empty.

First:

1. confirm the repository state,
2. inspect the current recommended Midnight project structure,
3. scaffold the application,
4. install only required dependencies,
5. create the Compact/tooling structure,
6. implement KAIROS.

Do not repeatedly reinitialize the project.

Keep the architecture minimal and maintainable.

---

# 12. TECH STACK

## Application

- Next.js
- App Router
- React
- TypeScript
- Tailwind CSS

Use **one Next.js full-stack application**.

Do not create:

- Express,
- NestJS,
- Fastify,
- a separate frontend,
- unnecessary databases,
- unnecessary microservices.

Use Next.js Route Handlers/server modules only when they provide real value.

Browser-only wallet and DApp Connector functionality must remain client-side.

## Midnight

- Midnight Network
- Compact
- Compact compiler
- Midnight proof server
- Midnight.js
- Midnight DApp Connector
- Lace

## Tooling

- Node.js 22
- appropriate test framework
- GitHub Actions

---

# 13. GLOBAL ENGINEERING RULES

These rules apply to the entire build.

## Evidence over assumptions

Never fabricate:

- APIs,
- package behavior,
- contract addresses,
- wallet addresses,
- transaction hashes,
- deployment results,
- test results,
- CI results,
- balances,
- proof results,
- market results,
- network state,
- privacy guarantees.

Only report results supported by actual evidence.

## Verification

For every requirement:

```text
Implement
→ Run
→ Inspect actual output
→ Fix
→ Re-run
→ Verify
```

Use only:

- VERIFIED
- NOT VERIFIED
- BLOCKED

Do not mark something complete merely because source code exists.

## Security

Never commit or expose:

- private keys,
- seed phrases,
- wallet secrets,
- API keys,
- credentials,
- sensitive environment variables.

Do not write private market data into unnecessary:

- logs,
- URLs,
- public API responses,
- commits,
- public metadata.

---

# 14. PROJECT MILESTONES

Work through the following milestones in order.

Do not move forward while a required technical acceptance criterion is still failing unless it is genuinely blocked by an external dependency.

---

# LEVEL 1 — SETUP & FIRST CONTRACT

## Goal

Create the real KAIROS Compact contract and establish the Midnight foundation.

### Environment

Verify:

- Node.js 22,
- Docker,
- Compact compiler,
- proof server,
- required dependencies,
- current network configuration.

### Contract

Implement the minimum valid contract containing:

- public ledger state,
- private witness/input,
- deliberate `disclose()`,
- market lifecycle,
- private position submission,
- replay protection,
- market closure,
- settlement,
- winner determination,
- treasury reallocation,
- asymmetric flip tax.

Add a top-level contract comment explaining:

- public state,
- private state,
- what is proved,
- what is intentionally disclosed.

### Compile

Run the real Compact compilation process.

Verify:

```text
managed/
```

exists and contains the expected generated artifacts.

### Tests

Create at least **3 meaningful passing tests** covering:

1. private/circuit logic,
2. state transitions,
3. privacy behavior.

Also test where practical:

- valid position,
- invalid position,
- settlement,
- replay rejection,
- treasury reallocation,
- asymmetric tax.

### Deployment

Deploy the actual KAIROS contract to the appropriate Midnight network.

Only record the address after actual verification.

### README

Create `README.md` with:

```text
# KAIROS

> Private conviction. Collective signal. Autonomous treasury rebalancing.

## Contract Address

## What This Does

## Privacy Model

## Tech Stack

## Prerequisites

## Setup

## Run Tests

## Initial Idea
```

Never invent the contract address.

---

# LEVEL 2 — FRONTEND INTEGRATION

## Goal

Connect the real contract to a working Next.js dApp.

### Wallet

Implement:

- Lace connect,
- Lace disconnect,
- connected wallet state,
- wallet errors,
- network mismatch handling.

### Midnight integration

Implement real:

- contract interaction,
- circuit calls,
- proof generation where required,
- transaction submission,
- transaction status handling.

### Dashboard

Display:

- treasury allocation,
- current market,
- market status,
- last winner,
- tax rates,
- tax revenue,
- wallet status.

Do not expose the user's private position.

### Private market

Allow:

1. select A or B,
2. provide private conviction/weight where required,
3. submit the real position,
4. receive transaction/proof confirmation.

### Market controls

Implement:

- close market,
- settle market,
- display verified winner,
- display treasury reallocation.

### Flip

Support:

```text
A → B
B → A
```

Display:

- amount,
- direction,
- tax,
- net amount,
- transaction state.

### Verification

Verify:

- development server,
- production build,
- wallet connection,
- real circuit interaction,
- contract calls,
- market flow,
- settlement,
- treasury changes,
- asymmetric tax,
- replay protection,
- loading states,
- error states,
- responsive UI.

Do not substitute mocked protocol behavior for real contract interaction.

---

# LEVEL 3 — PRODUCTION-GRADE DAPP

## Goal

Harden the application and satisfy the engineering requirements.

### Testing

Maintain meaningful coverage for:

- circuit logic,
- state transitions,
- privacy behavior,
- market lifecycle,
- replay protection,
- treasury invariants,
- asymmetric taxes,
- invalid transitions.

### CI

Create:

```text
.github/workflows/ci.yml
```

Run on:

- push,
- pull request.

The pipeline should:

1. install dependencies,
2. configure Node.js 22,
3. compile the Compact contract,
4. verify generated artifacts,
5. run tests,
6. build the Next.js application.

Verify the workflow actually passes.

### DApp review

Fix:

- TypeScript errors,
- broken imports,
- client/server boundary problems,
- environment configuration,
- network configuration,
- production build issues,
- console errors,
- loading states,
- error states,
- accidental secrets,
- incorrect treasury accounting,
- incorrect tax calculations,
- privacy leaks,
- dead code.

### Proposal

Create:

```text
PROPOSAL.md
```

with:

```text
# Product Proposal

## What is the product, and who uses it?

## Why Midnight specifically?

## Data Model

| Data Point | Type | Disclosed To |
|------------|------|--------------|

## Mainnet Feasibility
```

The contents must describe the actual implementation rather than hypothetical functionality.

### README

Keep README accurate and include:

- project overview,
- contract address,
- privacy model,
- privacy claim,
- tech stack,
- prerequisites,
- setup,
- tests,
- CI/CD,
- product proposal.

---

# LEVEL 4 — MVP

## Goal

Make KAIROS a coherent Confidential DeFi MVP.

### Economic loop

Verify the complete loop:

```text
Private conviction
→ Market resolution
→ Treasury reallocation
→ Flip
→ Tax
→ Treasury
→ Next market
```

Every stage must correspond to real behavior.

### Contract review

Verify:

- privacy behavior,
- market lifecycle,
- settlement,
- winner determination,
- treasury invariants,
- tax calculation,
- tax accounting,
- replay protection,
- deliberate disclosures.

### Frontend review

Polish:

- treasury display,
- market display,
- allocation visualization,
- privacy indicators,
- transaction status,
- loading states,
- errors,
- success states,
- responsive behavior.

The interface should feel like a real DeFi product rather than a tutorial.

### Usage documentation

Create:

```text
docs/USAGE.md
```

with:

```text
# How to Use KAIROS

## What You Need

## Step-by-Step Guide

## What Gets Proved

## What Stays Private

## Troubleshooting
```

Use plain English.

### README

Ensure README accurately reflects the current product, contract, privacy model, setup, testing, CI, and usage instructions.

---

# LEVEL 5 — FINAL TECHNICAL HARDENING

## Goal

Use the completed MVP as the baseline and perform a final technical hardening pass.

Do not expand the product unnecessarily.

### Contract

Re-audit:

- private state,
- disclosures,
- commitments/nullifiers,
- replay protection,
- market lifecycle,
- settlement,
- treasury invariants,
- tax accounting,
- invalid transitions.

### Application

Re-audit:

- Midnight/Lace integration,
- server/client boundaries,
- state synchronization,
- transaction handling,
- error recovery,
- loading behavior,
- stale contract references,
- environment configuration,
- responsive behavior.

### Privacy audit

Trace the complete path of private information:

```text
User input
→ Browser
→ Proof generation
→ Transaction
→ Contract
→ Public state
```

Verify that sensitive market information is not unnecessarily exposed at any point.

Check:

- source code,
- logs,
- API responses,
- URLs,
- browser state,
- contract state,
- generated artifacts where relevant.

Document any information that is intentionally disclosed.

### Reliability

Test:

- repeated submissions,
- repeated settlements,
- invalid market states,
- invalid positions,
- incorrect direction,
- insufficient balances/accounting,
- replay attempts,
- transaction failure paths,
- wallet rejection paths,
- network mismatch paths.

Fix all deterministic issues found.

### Documentation

Ensure:

- README is accurate,
- `PROPOSAL.md` matches the implementation,
- `docs/USAGE.md` matches the current UI,
- contract/privacy descriptions match real behavior,
- no unsupported claims remain.

### Final build verification

Run all deterministic checks required by the project.

At minimum verify:

```text
Compact compilation
Contract tests
Generated artifacts
Next.js production build
CI workflow
```

Everything reported as complete must have actual evidence.

---

# 15. FINAL REPOSITORY STRUCTURE

Maintain a clean project structure similar to:

```text
kairos/
├── contracts/
│   └── kairos.compact
├── managed/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── ...
├── tests/
├── docs/
│   └── USAGE.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── PROPOSAL.md
├── README.md
├── package.json
└── ...
```

Use the structure required by the actual installed tooling where it differs.

Do not force unnecessary files or folders.

---

# 16. COMMIT RULE

Commit autonomously throughout development.

Target **30+ meaningful commits** across the implementation.

Requirements:

- commit at natural milestones,
- one logical purpose per commit,
- inspect the relevant diff first,
- no empty commits,
- no fake milestone commits,
- no artificial splitting,
- no secrets.

Examples:

```text
feat: scaffold kairos midnight application
feat: implement market state
feat: add private position circuit
feat: add replay protection
feat: implement market settlement
feat: implement treasury reallocation
feat: implement asymmetric tax
feat: integrate lace wallet
feat: build private market flow
feat: build treasury dashboard
test: add settlement coverage
test: add replay protection coverage
fix: prevent double settlement
fix: correct treasury tax accounting
ci: add compact build pipeline
docs: document privacy model
docs: add usage guide
```

---

# 17. BLOCKER PROTOCOL

If an external/manual action is genuinely required:

1. complete all independent work first,
2. identify exactly what is blocked,
3. explain why it is blocked,
4. state the exact required action,
5. state the expected successful result.

Do not fabricate progress.

Do not stop because of an ordinary coding error.

---

# 18. FINAL ACCEPTANCE CHECKLIST

## Level 1

```text
[ ] Node.js 22 verified
[ ] Docker verified
[ ] Compact compiler verified
[ ] Proof server verified
[ ] Current Midnight documentation consulted
[ ] KAIROS Compact contract implemented
[ ] Public ledger state exists
[ ] Private witness exists
[ ] disclose() used deliberately
[ ] managed/ generated
[ ] 3+ meaningful tests pass
[ ] Privacy behavior tested
[ ] Contract deployed
[ ] Contract address verified
[ ] README created
```

## Level 2

```text
[ ] Next.js application works
[ ] Lace connect works
[ ] Lace disconnect works
[ ] Real Midnight integration works
[ ] Real circuit/proof flow works
[ ] Private market flow works
[ ] Market close works
[ ] Settlement works
[ ] Treasury reallocation works
[ ] A → B flip works
[ ] B → A flip works
[ ] Replay protection works
[ ] Loading states work
[ ] Error states work
[ ] Responsive UI works
[ ] Production build passes
```

## Level 3

```text
[ ] Contract tests remain passing
[ ] CI workflow exists
[ ] CI runs on push
[ ] CI runs on pull request
[ ] Compact compilation runs in CI
[ ] Tests run in CI
[ ] Next.js build runs in CI
[ ] CI passes
[ ] Error handling is production-ready
[ ] Privacy behavior is clearly represented
[ ] PROPOSAL.md exists
[ ] README is complete and accurate
```

## Level 4

```text
[ ] Core KAIROS loop works end-to-end
[ ] Product behaves as one coherent Confidential DeFi system
[ ] Contract behavior is verified
[ ] Frontend is polished
[ ] docs/USAGE.md exists
[ ] README is synchronized with implementation
[ ] Privacy claims match implementation
[ ] Economic claims match implementation
```

## Level 5

```text
[ ] Final contract audit completed
[ ] Final privacy audit completed
[ ] Final application audit completed
[ ] Replay protection verified
[ ] Invalid state transitions verified
[ ] Failure paths verified
[ ] Documentation synchronized
[ ] All deterministic project checks pass
[ ] No known deterministic build errors remain
[ ] No unsupported claims remain
```

---

# 19. FINAL RESPONSE FORMAT

At the end of each milestone, report only:

```text
LEVEL:
VERIFIED:
NOT VERIFIED:
BLOCKED:

Contract:
Tests:
Build:
CI:
Files changed:
Remaining manual action:
```

Only report evidence-backed results.

Never claim a level is complete if a required technical criterion remains unverified.

# FINAL RULE

Build the real product.

Keep the implementation as small as possible while satisfying the technical requirements.

Prefer:

**correctness → real Midnight privacy → deterministic behavior → complete end-to-end flow → verification**

over unnecessary features.

When two implementations satisfy the same requirement, choose the simpler one.
