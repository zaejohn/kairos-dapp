---
name: research-before-change
description: Use before version-sensitive, unfamiliar, dependency, architecture, or Midnight changes; skip for trivial local edits with fully known behavior.
---

1. Read applicable `AGENTS.md` and `git status`.
2. Trace the current code path and existing tests.
3. Write the acceptance condition in one or two sentences.
4. Verify uncertain APIs/versions using official docs or deterministic tooling.
5. Record only the decision-relevant evidence; do not paste large transcripts.
6. Implement only after the evidence resolves material unknowns.
7. If evidence remains ambiguous, choose the reversible option and state the uncertainty.
