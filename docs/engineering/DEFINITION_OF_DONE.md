# Definition of Done

A change is done only when all applicable items are true:

- Requested behavior and acceptance criteria are satisfied.
- The implementation matches existing architecture or deliberately documents a changed decision.
- No unrelated changes are included.
- Changed behavior has an appropriate automated test or a documented reason it cannot.
- TypeScript typecheck passes for code changes.
- Lint passes for code changes.
- Relevant unit/integration tests pass.
- User-visible flows receive browser verification when applicable.
- Build passes for application/dependency/config changes.
- Compact changes compile with the pinned compiler and pass relevant contract tests.
- Midnight transaction/provider changes include evidence from the intended network/environment before being claimed as runtime-successful.
- Privacy/security implications were reviewed for contract/wallet/proof changes.
- No secrets, private state, generated junk, debug output, or accidental large artifacts are committed.
- Final diff was reviewed (`git diff --check` plus semantic review).
- Documentation/env examples changed when the developer/operator contract changed.
- A coherent milestone may be committed with a Conventional Commit message.

If a gate is unavailable, completion must say which gate was not run and why.
