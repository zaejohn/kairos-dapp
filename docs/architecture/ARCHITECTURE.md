# Architecture

## Boundaries

This repository is one Next.js full-stack application. It is not a monorepo and does not introduce a second backend service.

```text
Browser
  ├─ Next.js UI / client components
  ├─ Lace via DApp Connector API
  └─ local/controlled proof server (when proving is required)
        ↓
Next.js App Router
  ├─ server components
  ├─ route handlers / server-side application logic
  └─ shared typed domain modules
        ↓
Midnight adapters
  ├─ wallet boundary
  ├─ provider/transaction boundary
  └─ compiled Compact bindings
        ↓
Midnight network
```

## Directory intent

- `src/app/` — routes, layouts, route handlers.
- `src/components/` — reusable UI.
- `src/features/` — feature-specific UI/application modules as the product grows.
- `src/lib/` — stable framework/domain integrations and pure utilities.
- `src/lib/midnight/` — the only default home for Midnight browser/provider adapters.
- `contracts/src/` — hand-written Compact source.
- `contracts/managed/` — compiler output; generated and ignored.
- `tests/unit/` — fast deterministic application tests.
- `tests/e2e/` — Playwright browser tests.
- `.codex/` — Codex project config and narrow agent roles.
- `.agents/skills/` — progressively loaded workflows.

## Dependency direction

UI may depend on feature/domain adapters. Domain modules must not depend on React. Midnight-specific SDK types should not leak throughout unrelated UI code; wrap them in project-owned adapters/types.

## Server/client boundary

Lace and `window.midnight` exist only in the browser. Never import browser wallet code into a server-only module. Server code may perform public data work when appropriate, but it must not pretend to possess a user's wallet or browser-local private state.

## Error boundary

Integration code converts unknown third-party errors into `AppError` values with stable codes and safe user messages. Raw third-party payloads may be attached as causes for local diagnostics but must not be serialized to clients by default.

## Logging

Use `src/lib/logging/logger.ts`. Log event names plus small structured metadata. The logger rejects common secret-shaped keys. Do not log private Midnight witness data even if a redactor exists.
