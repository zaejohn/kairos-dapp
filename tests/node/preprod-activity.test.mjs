import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyPreprodActivity } from "../../scripts/midnight/verify-preprod-activity.mjs";

const address = "a".repeat(64);
const txId = `00${"b".repeat(64)}`;
const successfulCall = {
  __typename: "RegularTransaction",
  hash: "c".repeat(64),
  identifiers: [txId],
  block: { height: 123, timestamp: 1_790_000_000_000 },
  transactionResult: { status: "SUCCESS" },
  contractActions: [{ __typename: "ContractCall", address, entryPoint: "commitPosition" }],
};

function indexer(transactions) {
  return async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.variables.reference, txId);
    assert.match(request.query, /transactions\(offset: \{ identifier: \$reference \}\)/);
    return { ok: true, json: async () => ({ data: { transactions } }) };
  };
}

test("accepts only a finalized successful call on the exact contract and circuit", async () => {
  const result = await verifyPreprodActivity(address, txId, "commitPosition", indexer([successfulCall]));
  assert.deepEqual([result.status, result.blockHeight, result.circuitId], ["SUCCESS", 123, "commitPosition"]);
});

test("accepts the transaction hash returned by Midnight.js", async () => {
  const result = await verifyPreprodActivity(address, successfulCall.hash, "commitPosition", async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.variables.reference, successfulCall.hash);
    assert.match(request.query, /transactions\(offset: \{ hash: \$reference \}\)/);
    return { ok: true, json: async () => ({ data: { transactions: [successfulCall] } }) };
  });
  assert.equal(result.transactionHash, successfulCall.hash);
});

test("rejects a different contract or circuit even when the transaction succeeded", async () => {
  await assert.rejects(verifyPreprodActivity("d".repeat(64), txId, "commitPosition", indexer([successfulCall])), /does not contain/);
  await assert.rejects(verifyPreprodActivity(address, txId, "resolveRound", indexer([successfulCall])), /does not contain/);
});

test("rejects missing, failed, and unfinalized transactions", async () => {
  await assert.rejects(verifyPreprodActivity(address, txId, "commitPosition", indexer([])), /No finalized/);
  await assert.rejects(verifyPreprodActivity(address, txId, "commitPosition", indexer([{ ...successfulCall, identifiers: ["d".repeat(64)] }])), /No finalized/);
  await assert.rejects(verifyPreprodActivity(address, txId, "commitPosition", indexer([{ ...successfulCall, transactionResult: { status: "FAILURE" } }])), /not a finalized full success/);
  await assert.rejects(verifyPreprodActivity(address, txId, "commitPosition", indexer([{ ...successfulCall, block: null }])), /not a finalized full success/);
});

test("validates inputs before querying the indexer", async () => {
  await assert.rejects(verifyPreprodActivity("invalid", txId, "commitPosition", indexer([])), /64-hex/);
  await assert.rejects(verifyPreprodActivity(address, txId, "unknown", indexer([])), /Kairos circuit/);
});
