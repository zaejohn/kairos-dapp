# Application Scope

- Keep App Router server components as the default; add `"use client"` only at browser-interaction boundaries.
- Do not move wallet APIs, browser globals, or private client state into server components.
- Route handlers validate all untrusted input and return stable error shapes.
- Keep business/domain logic out of page components; place it in focused modules under `src/lib` or `src/features`.
- Preserve strict TypeScript boundaries and test changed behavior.
- A UI change is not verified by typecheck alone; run the relevant component or Playwright test.
