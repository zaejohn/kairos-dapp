# Repository Operating Contract

## Mission

Ship correct, reviewable changes with evidence. Optimize for accuracy, maintainability, recovery, and cost—not maximum agent count.

## Project source map

For this product, load project-specific context progressively:

- `docs/product/PRODUCT.md` — product identity and core architecture;
- `docs/product/ECONOMICS.md` — Fantastical Factory-derived economic principles and boundaries;
- `docs/product/PRIVACY_MODEL.md` — privacy goal, threats, and verified-claim rules;
- `docs/product/UI.md` — interactive reference-image UI/UX requirements;
- `docs/challenge/LEVELS_1_5.md` — authoritative Level 1–5 requirements.

Do not preload all of these for unrelated work. The short task launcher is `docs/prompts/START_LEVELS_1_5.md`.

## Evidence order

When facts conflict, prefer:

1. repository code and tests;
2. compiler/typechecker/runtime output;
3. official version-matched documentation;
4. tool output and reproducible experiments;
5. assumptions only when explicitly labeled.

Never invent APIs, files, environment variables, network behavior, or successful verification.

## Before editing

- Read `git status` and preserve unrelated user changes.
- Read the closest applicable `AGENTS.md` for every file you will touch.
- Trace the existing execution path before proposing a replacement.
- Search for existing utilities/tests before adding abstractions.
- For version-sensitive framework or Midnight behavior, verify official docs first.

## Agent orchestration

- Default to the main agent for small or sequential work.
- Delegate only independent, bounded work where parallelism improves quality or latency.
- Prefer parallel readers for exploration, docs lookup, tests, and triage.
- Maximum normal concurrency: 3 subagents.
- Never let two agents write the same file tree concurrently.
- A subagent returns concise findings/evidence, not raw logs.
- The lead owns integration, final decisions, and the final verification gate.

## Change loop

1. Reproduce/understand.
2. Define the smallest defensible change and success criteria.
3. Add or update a test when behavior changes.
4. Implement without unrelated refactors.
5. Run the narrowest useful checks first.
6. Run the required repository gates.
7. Review the diff for correctness, secrets, dead code, and accidental scope growth.
8. Commit only a coherent green milestone.

## Verification matrix

- Docs/config only: syntax/format checks + targeted validation.
- TypeScript logic: relevant unit tests + `npm run typecheck`.
- UI: unit/component tests + relevant Playwright flow when behavior is user-visible.
- API/server behavior: unit/integration tests + typecheck.
- Dependency/config change: install resolution + tests + build.
- Compact change: exact compiler check + compile + contract tests + privacy/security review.
- Wallet/proof/provider change: tests + manual/runtime evidence on the target network before claiming success.

Never say "done", "fixed", or "working" when the required verification did not run. State exactly what was and was not verified.

## Git safety

- Do not discard, overwrite, stash, or reset user changes unless explicitly requested.
- No `git reset --hard`, `git clean -fd`, force push, or history rewrite by default.
- Do not push or merge without explicit instruction.
- Autonomous commits are allowed after a coherent milestone passes its required checks.
- Use Conventional Commits; one logical concern per commit.
- For parallel write work, use separate worktrees/branches with non-overlapping ownership.

## Code rules

- TypeScript strict mode; avoid `any`. Narrow unknown values explicitly.
- Keep browser-only wallet code behind `"use client"` boundaries.
- Keep server secrets out of `NEXT_PUBLIC_*` variables.
- Prefer small pure modules and explicit dependency boundaries.
- Fail with actionable errors; do not swallow exceptions.
- Logs must be structured and must not contain secrets or private Midnight witness data.
- Add dependencies only when existing platform/library primitives are insufficient.

## Long-running work

For multi-step work, update `docs/agent/STATE.md` at meaningful milestones only. Keep it concise: goal, current decision, verified evidence, blockers, last green checks, next step.

## Definition of Done

Apply `docs/engineering/DEFINITION_OF_DONE.md`. If a required gate cannot run, record the blocker and do not substitute confidence for evidence.

## Code Review Rules

Prioritize correctness, security/privacy, regressions, error handling, race/state issues, and missing tests. Ignore cosmetic style unless it hides a functional problem.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
