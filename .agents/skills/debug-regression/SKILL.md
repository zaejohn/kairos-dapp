---
name: debug-regression
description: Use for failures, flaky behavior, runtime errors, regressions, or unclear root causes; do not jump straight to a speculative fix.
---

1. Capture the exact failing command, input, environment, and error.
2. Reproduce once without changing code.
3. Reduce the failure to the smallest responsible boundary.
4. Form one falsifiable hypothesis at a time and test it.
5. Fix the root cause with the smallest patch.
6. Add a regression test that fails for the old behavior.
7. Re-run the original reproduction and relevant gates.
8. If not reproducible, report that honestly and preserve diagnostic evidence instead of guessing.
