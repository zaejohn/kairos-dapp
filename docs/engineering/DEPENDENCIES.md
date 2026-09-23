# Dependency Policy

- Prefer platform, React/Next, and existing library primitives before adding a package.
- For security-sensitive or fast-moving stacks, pin exact compatible versions rather than floating majors.
- Midnight packages follow `docs/midnight/VERSIONS.md`, even when npm publishes a newer incompatible ledger/toolchain line.
- A dependency change must explain: problem solved, existing alternative rejected, maintenance/security cost, and bundle/runtime impact when relevant.
- Run install resolution, targeted tests, typecheck, and build after dependency changes.
- Do not upgrade Compact/Midnight components independently of the official compatibility matrix.
- Keep a generated lockfile in real projects and update it in the same commit as dependency changes.
