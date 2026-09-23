# Compact Contract Scope

- Compiler/tool output is authoritative. Target Compact toolchain 0.31.x and language 0.23 unless `docs/midnight/VERSIONS.md` is deliberately updated.
- Never edit `contracts/managed/**` by hand.
- Treat exported circuit identity, contract address, ledger writes, disclosed values, and timing as observable.
- Treat witness results as prover-controlled. Constrain every security-relevant witness with assertions/commitments; do not trust `ownPublicKey()` as authentication.
- Every `disclose()` requires an intentional public-boundary reason.
- Prefer domain-separated hashes/commitments and explicit replay/nullifier design for identity/authorization flows.
- Contract changes require compile + focused tests + security/privacy review before completion.
- Keep example/demo contracts obviously labeled; do not mistake them for production authorization patterns.
