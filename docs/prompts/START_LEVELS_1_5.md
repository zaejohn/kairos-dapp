# Codex Start Prompt — Levels 1–5

Paste the prompt below from the repository root after the required visual-reference assets are present (or accept the documented visual-reference blocker).

---

You are the lead Codex agent for this repository.

## Goal

Build the product defined in `docs/product/PRODUCT.md` into one cumulative Midnight Preprod application that satisfies Levels 1–5 in `docs/challenge/LEVELS_1_5.md`.

Use `docs/product/ECONOMICS.md` for the Fantastical Factory-derived economic principles, `docs/product/PRIVACY_MODEL.md` for the required privacy boundary, and `docs/product/UI.md` for the product UI/UX and reference-image behavior.

Use the repository's existing `AGENTS.md`, scoped instructions, project skills, custom agents, verification scripts, and Definition of Done as the engineering operating system. Do not restate or replace those rules.

## Execution

1. Inspect the repository and current Git state first.
2. Verify current Midnight Preprod compatibility and any version-sensitive behavior against official documentation before relying on it.
3. Study the relevant Fantastical Factory documentation before locking the economic architecture.
4. Record concise durable decisions in the repository rather than repeatedly carrying large research context.
5. Implement sequentially from Level 1 through Level 5 in the same application.
6. A level may advance only after its technically applicable exit criteria have evidence.
7. Continue through non-blocked work automatically; an external/manual blocker stops only the dependent requirement.
8. Use meaningful autonomous milestone commits after green verification; do not manufacture commits only to satisfy a count.

## Constraints

- Preserve the product identity; do not turn it into Private Voting or another challenge example.
- Never invent Midnight APIs, privacy guarantees, wallet support, token behavior, deployment evidence, addresses, transactions, organizer approval, users, or feedback.
- If a desired mechanism is unsupported by verified Midnight capabilities, implement the strongest correct supported design, preserve sensible upgrade boundaries, and document the limitation.
- Target Preprod only; ignore Level 6/Mainnet.
- Vercel/Netlify deployment, screenshots, demo videos, manual user acquisition, and manual feedback collection are external/manual deliverables unless a repository placeholder is needed.
- Keep UI, contract behavior, docs, tests, and product copy consistent with functionality that actually exists.

## Level reporting

At each level checkpoint report only:

**Goal → Changes → Tests → Verification → Remaining Issues → Exit Status**

Use `PASS`, `PARTIAL`, or `BLOCKED`, then continue immediately to the next technically permitted work.

## Completion

Completion means all technically achievable Level 1–5 requirements are implemented and verified in this single repository, with genuine external blockers explicitly recorded and no unsupported functionality represented as complete.

Start now by inspecting the repository, reading the project source docs above, and performing the Level 1 research/architecture work required to avoid Level 4–5 rewrites.
