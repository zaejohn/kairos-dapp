# Pinned Midnight Compatibility Surface

Verified against the official Midnight compatibility matrix updated **2026-09-22**.

| Component | Version |
| --- | ---: |
| Compact devtools (`compact`) | 0.5.1 |
| Compact toolchain/compiler | 0.31.1 |
| Compact language | 0.23 |
| Compact runtime | 0.16.0 |
| Compact JS | 2.5.1 |
| Platform JS | 2.2.4 |
| Midnight.js | 4.1.1 |
| DApp Connector API | 4.0.1 |
| testkit-js | 4.1.1 |
| Proof server | 8.1.0 |
| Preprod node | 1.0.3 |
| Preprod indexer | 4.3.302 |

Do not replace these with npm `latest` independently. Newer Compact/runtime packages may target a different ledger generation and can be incompatible with current public networks.

When intentionally upgrading:

1. Read the latest official compatibility matrix and release notes.
2. Update this file first in the branch.
3. Update all dependent packages/tooling as one compatibility set.
4. Recompile contracts from source.
5. Run unit/contract tests and a controlled network smoke test.
6. Do not reuse generated artifacts from the prior compiler line.
