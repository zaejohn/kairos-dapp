# Test Scope

- Test observable behavior, not implementation trivia.
- A bug fix should gain a regression test when reproduction is deterministic.
- Keep unit tests fast and deterministic; no real network in unit suites.
- Put real browser flows in `tests/e2e` and isolate network-dependent Midnight tests from generic CI.
- Never weaken an assertion just to make a failing implementation pass.
- Avoid arbitrary sleeps; wait on observable state or bounded conditions.
