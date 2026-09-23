# Privacy Model

## Goal

Keep individual market positions and strategies private while allowing the protocol to act on the minimum aggregate result required for treasury rebalancing.

This is a desired property, not an assumption. Verify it against current Midnight/Compact behavior before making privacy claims.

## Potentially sensitive data

- chosen market side;
- position and/or position size;
- strategy;
- commitment secrets/nonces;
- participant-specific private state.

Use witnesses, private state, commitments, nullifiers, selective disclosure, and proofs only when current official documentation and the implementation support them correctly.

## High-risk area: multi-user aggregation

Do not assume that private witnesses automatically create private aggregation across independent users.

Before implementing resolution, verify how the design handles:

- multiple independent participants;
- public state deltas;
- commitments and replay protection;
- duplicate participation;
- timing/linkability;
- what the proof server receives;
- what becomes visible in transaction/ledger state.

If the ideal aggregate mechanism is not achievable within the current Midnight model or challenge scope:

1. identify the exact limitation;
2. implement the strongest correct privacy-preserving alternative;
3. preserve clean upgrade boundaries;
4. document what remains private and what necessarily becomes public.

Correct privacy is more important than feature completeness.

## Required privacy review

Before accepting privacy-sensitive changes, review:

- witness inputs;
- explicit disclosures;
- public ledger state;
- circuit outputs;
- browser/server logs;
- proof-server boundary;
- wallet/address correlation;
- public state deltas;
- timing leakage;
- replay/double-action behavior.

README privacy claims must match verified behavior.
