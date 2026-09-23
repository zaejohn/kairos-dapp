---
name: implement-and-verify
description: Use for normal feature or bug-fix implementation when code must be changed and verified before completion.
---

1. Reproduce or identify current behavior.
2. Select the smallest file set and tests that prove the requested change.
3. Add/update a failing or discriminating test when practical.
4. Implement the smallest coherent patch.
5. Run targeted tests, then typecheck/lint as applicable.
6. Inspect `git diff --check` and the final diff.
7. Run the repository gate required by `AGENTS.md`.
8. Do not claim success if a required gate was skipped or failed.
