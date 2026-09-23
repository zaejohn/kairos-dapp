---
name: midnight-change
description: Use for Compact contracts, Midnight.js/providers, Lace wallet, proof server, network configuration, private state, or transaction flows.
---

1. Confirm target network and the pinned compatibility matrix versions in `docs/midnight/VERSIONS.md`.
2. Inspect the nearest Midnight/contract `AGENTS.md` and existing tests.
3. Verify version-sensitive syntax/API against official Midnight docs and compiler output.
4. For Compact, model three adversaries: chain observer, malicious prover, off-chain infrastructure operator.
5. Mark every private-to-public boundary; justify each `disclose()` and public ledger write.
6. Compile with Compact 0.31.x; never edit `contracts/managed/**` manually.
7. Run contract tests. For transaction changes, verify proof → balance → submit → finalize behavior where applicable.
8. Use only a local/controlled proof server for private witness data.
9. Record the exact network/tool versions used for runtime evidence.
