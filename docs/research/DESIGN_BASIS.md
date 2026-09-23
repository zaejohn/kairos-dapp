# Research and Design Basis

Research snapshot: **2026-09-23**.

This boilerplate is synthesized from Codex-native capabilities, OpenAI prompting guidance, current Next.js agent-oriented tooling, current Midnight documentation, and common agentic-engineering frameworks. It does not copy one framework wholesale.

## Sources reviewed

### OpenAI / Codex

- Codex project configuration and precedence: https://learn.chatgpt.com/docs/config-file/config-basic
- `AGENTS.md` discovery and nested scope: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Codex subagents and custom agent TOML: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Codex skills / progressive disclosure: https://learn.chatgpt.com/docs/build-skills
- Codex worktrees: https://learn.chatgpt.com/docs/environments/git-worktrees
- Codex review workflow: https://learn.chatgpt.com/docs/code-review
- Codex long-running work: https://learn.chatgpt.com/docs/long-running-work
- GPT-6 Sol model: https://developers.openai.com/api/docs/models/gpt-6-sol
- OpenAI prompt engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching

### Midnight

- Compatibility matrix: https://docs.midnight.network/relnotes/support-matrix
- Next.js + Lace connector: https://docs.midnight.network/guides/nextjs-wallet-connect
- Local proving: https://docs.midnight.network/guides/local-proving
- Security and best practices: https://docs.midnight.network/guides/security-best-practices
- Official Hello World example: https://github.com/midnightntwrk/example-hello-world
- Compact releases: https://github.com/midnightntwrk/compact/releases

### Framework/community patterns compared

- Superpowers: https://github.com/obra/superpowers
- GitHub Spec Kit: https://github.com/github/spec-kit
- BMAD Method: https://github.com/bmad-code-org/BMAD-METHOD
- OpenHands: https://github.com/All-Hands-AI/OpenHands
- AGENTS.md open format: https://agents.md/

## What was kept

### From Codex-native guidance

- Small root instructions plus nested scoped instructions.
- Project-local custom agents instead of giant role prompts.
- Skills for workflows that should load only when needed.
- Parallel agents primarily for read-heavy independent work.
- Worktrees when substantial write tasks truly need parallelism.
- Independent review instead of self-certification by the implementation agent.

### From Superpowers-style workflows

- Verification before completion.
- Reproduction/root-cause discipline for debugging.
- Tests as evidence for behavior changes.
- Small reversible Git milestones.

Kept as concise skills rather than a large mandatory skill catalog.

### From spec-driven systems

- Durable state, acceptance criteria, and explicit evidence for long-running work.

Kept lightweight: two short files (`STATE.md`, `TASKS.md`) rather than a document-heavy pipeline for every change.

### From larger multi-agent frameworks

- Explicit responsibility boundaries and handoff contracts.

Rejected the large permanent cast of specialized roles because it duplicates context and increases coordination/token cost for a single application repository.

### From OpenHands-like architecture

- Clear execution state and recoverability are valuable.

Rejected introducing a separate controller/event-stream framework because Codex already supplies orchestration, sessions, tools, worktrees, and subagents. Repository conventions are enough here.

## Key design choices

### 1. Four specialists, not ten

The main agent is the lead. Four custom agents cover the high-value separations:

- evidence/research (read-only);
- bounded implementation;
- Midnight-specific high-risk implementation;
- independent verification/review.

Debugging, architecture, security, and documentation are workflows or lead responsibilities unless a specific task is large enough to justify a temporary agent.

### 2. GPT-6 Sol where ambiguity/risk is high; Luna where scope is narrow

The project default is GPT-6 Sol at high reasoning. Read-heavy exploration and bounded implementation default to GPT-6 Luna max for lower cost and faster throughput. Midnight and verification use Sol high because privacy, compatibility, and transaction correctness are higher-risk.

### 3. Context is hierarchical and progressive

Universal rules live at the root. Framework/module rules live in nested `AGENTS.md`. Workflow instructions live in skills. Reference docs are read only when needed. This avoids paying repeatedly for a huge universal prompt and reduces contradictory instruction pressure.

### 4. One writer is the safe default

Parallel readers are cheap to coordinate. Parallel writers are not. Write-heavy parallelism requires disjoint file ownership, preferably separate worktrees, followed by lead integration and verification.

### 5. Midnight is compiler/evidence driven

Midnight's own documentation warns that AI-generated Compact/Midnight code can be wrong because ecosystem material is sparse and fast-moving. This boilerplate therefore pins the compatibility matrix, verifies Compact syntax with the actual compiler, isolates generated artifacts, and requires explicit public/private-boundary review.

### 6. Verification is layered

Run the narrowest discriminating check first, then the repository gate. A wallet prompt or a proof-server process existing is not enough evidence: transaction stages and proof-server health/readiness are checked separately.

### 7. Git is autonomous but recoverable

Codex may commit after coherent green milestones, which preserves long-running recovery points. Destructive reset/clean, force-push, shared-history rewriting, push, and merge remain opt-in operations.
