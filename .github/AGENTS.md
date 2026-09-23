# CI Scope

- CI is a verification gate, not a place to hide local-only assumptions.
- Pin major action versions and runtime versions.
- Never print secrets or wallet material.
- Keep generic app CI independent from external Midnight network availability.
- Network/proof integration workflows must be explicit and may require protected secrets/environment approval.
