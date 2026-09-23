# Midnight Development Workflow

## 1. Choose the network explicitly

Use `NEXT_PUBLIC_MIDNIGHT_NETWORK` for the Lace connection target. The starter allows `undeployed`, `preview`, `preprod`, and `mainnet`. The example env uses `preprod`.

Never silently reinterpret one network as another.

## 2. Compact changes

1. Read `contracts/AGENTS.md`.
2. Confirm `compact compile --version` is on the 0.31.x toolchain.
3. Edit only source under `contracts/src/`.
4. Run `npm run compact:compile`.
5. Review compiler diagnostics; generated output goes to `contracts/managed/`.
6. Add/run contract tests appropriate to the behavior.
7. Review every public ledger write and `disclose()` boundary.

Generated artifacts are rebuildable and ignored in this boilerplate. A deployment pipeline may choose to package them as release artifacts, but they should never be hand-edited.

## 3. Proof server

Start the pinned server:

```bash
npm run proof:up
npm run proof:status
```

The compose file binds to `127.0.0.1:6300` rather than all interfaces.

The proof server receives private witness inputs. Use local proving or an operator-controlled encrypted remote service only. Do not send private proving input to an arbitrary public endpoint.

The transaction lifecycle should be diagnosed in stages:

1. execute circuit / construct unproven transaction;
2. prove;
3. wallet balance/sign;
4. submit;
5. wait for finalization.

A signing prompt does not prove steps 3–5 succeeded.

## 4. Lace wallet

Wallet code belongs in client components/adapters because it depends on browser injection. Detect `window.midnight.mnLace`; do not assume installation.

The adapter should:

- connect to the explicitly configured network;
- return a normalized project-owned shape;
- surface unsupported/missing-wallet errors;
- avoid logging full wallet responses;
- keep SDK-specific types at the integration boundary.

## 5. Privacy/security review

For each exported circuit ask:

- What does a chain observer learn from the called circuit, ledger writes, disclosed values, contract, and timing?
- Which inputs/results are controlled by a malicious prover, and what assertions constrain them?
- What private data reaches a proof server, indexer, browser store, or other operator?

Never use unconstrained witness data as authentication. In particular, do not assume a witness-returned public key is cryptographically bound to the wallet that later signs the transaction.

## 6. Runtime evidence

Before claiming a transaction path works, record:

- network;
- Compact compiler/toolchain;
- Midnight.js/DApp Connector versions;
- proof server version/readiness;
- exact test/smoke command;
- transaction/finalization evidence that contains no secrets.
