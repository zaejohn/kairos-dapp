# Codex Operating Model

## Why this is intentionally small

The repository uses one lead plus four project-scoped specialists. More standing roles would duplicate context and make handoffs more expensive. Architecture, debugging, security review, and documentation are workflows/skills unless the task is large enough to justify a dedicated temporary subagent.

## Roles

| Role | Default model | Writes? | Use when |
| --- | --- | --- | --- |
| Lead/orchestrator | GPT-6 Sol medium | Yes | Requirements, planning, integration, cross-cutting decisions, final verification |
| `evidence_researcher` | GPT-6 Luna high | No | Codebase mapping, official docs, version/API confirmation, triage |
| `implementer` | GPT-6 Luna high | Bounded | Clear, low/medium-risk implementation after acceptance criteria exist |
| `midnight_specialist` | GPT-6 Sol high | Bounded | Compact, providers, wallet, proving, privacy/security-sensitive Midnight work |
| `verifier` | GPT-6 Sol high | Test/build artifacts only | Independent falsification, review, final high-risk verification |

## Model selection

Use **Sol medium** for the lead because integration and ambiguous multi-step work benefit most from stronger reasoning. Use **Luna high** for narrow exploration and ordinary bounded implementation to control cost. Escalate to **Sol high** for Midnight correctness/privacy, difficult debugging, cross-boundary architecture, or independent verification of high-risk changes.

Do not raise reasoning/model tier merely because a task is long. Raise it when ambiguity, risk, or cross-file reasoning requires it.

## Delegation rules

Delegate only if at least one is true:

- two or more independent read-heavy questions can be answered in parallel;
- a verifier can independently test a completed patch;
- a bounded implementation slice has non-overlapping file ownership;
- a Midnight specialist is required while the lead handles unrelated application work.

Stay single-agent when work is sequential, tiny, or shares mutable state heavily.

Normal cap: **3 concurrent subagents**. More concurrency is allowed only for an explicitly partitioned read-only review.

## Write ownership

Parallel writers must have disjoint directory/file ownership. If ownership overlaps, serialize the work. Prefer Git worktrees for substantial parallel implementation, and integrate through the lead after each branch passes its local gate.

## Context management

The lead context should contain decisions, constraints, acceptance criteria, and summarized evidence—not full test logs or large file dumps. Subagents return distilled findings.

Instruction hierarchy:

1. user task;
2. root `AGENTS.md` universal behavior;
3. nested `AGENTS.md` for the active directory;
4. selected skill for the current workflow;
5. custom agent instructions for delegated specialization;
6. referenced docs only when needed.

This keeps recurring prompt context small while allowing task-specific depth on demand.

## Long-running tasks

Use `docs/agent/STATE.md` only when work is genuinely multi-step. Update it after verified milestones, before risky transitions, and before ending a long session. Do not use it as a transcript.

A state update should answer:

- What is the goal?
- What is now known/decided?
- What has been verified?
- What is blocked?
- What is the next concrete action?

## Recovery

If an agent fails or introduces a regression:

1. Stop parallel writers touching the affected boundary.
2. Preserve current user work; inspect `git status` and diff.
3. Reproduce the failure from the last known-green commit or test.
4. Identify the smallest bad change/commit; do not reset blindly.
5. Prefer a corrective commit or selective revert over history rewriting.
6. Re-run the original failing reproduction plus the required gates.
7. Update `STATE.md` with the root cause and recovered green checkpoint for long-running work.
