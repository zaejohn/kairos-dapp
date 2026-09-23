# Midnight Application Scope

- Verify current APIs against the pinned versions in `docs/midnight/VERSIONS.md`; never code from memory when an API is uncertain.
- Wallet access is browser-only and must stay behind a client boundary.
- Do not log seeds, private state, witnesses, proofs containing sensitive inputs, or full wallet payloads.
- Do not silently switch networks. Surface the configured/connected network and fail on unsupported values.
- Prefer typed adapters around wallet/provider APIs so version changes have one boundary.
- A successful wallet prompt is not proof of a successful transaction. Distinguish connect, prove, balance, submit, and finalization failures.
- Proof servers that process private witness inputs must be local or operator-controlled over an encrypted channel.
