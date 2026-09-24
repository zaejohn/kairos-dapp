import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { verifyContractState } from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { createVerifierKey } from "@midnight-ntwrk/midnight-js-types";
import { ledger } from "../../contracts/managed/kairos/contract/index.js";

const INDEXER_HTTP = "https://indexer.preprod.midnight.network/api/v4/graphql";
const INDEXER_WS = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";
const CIRCUITS = [
  "initializeEconomy", "buyQuote", "sellQuote", "commitPosition",
  "resolveRound", "expireRound", "rebalanceTreasury", "startNextRound",
];
const HEX_32 = /^[0-9a-f]{64}$/i;
const TX_IDENTIFIER = /^(?:[0-9a-f]{64}|[0-9a-f]{66})$/i;
const DEPLOY_QUERY = `query Deployment($address: HexEncoded!) {
  contractAction(address: $address) {
    __typename
    ... on ContractDeploy {
      transaction {
        block { height timestamp }
        ... on RegularTransaction { identifiers transactionResult { status } }
      }
    }
    ... on ContractCall {
      deploy {
        transaction {
          block { height timestamp }
          ... on RegularTransaction { identifiers transactionResult { status } }
        }
      }
    }
  }
}`;

function fail(message) {
  throw new Error(message);
}

async function deploymentTransaction(address) {
  const response = await fetch(INDEXER_HTTP, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: DEPLOY_QUERY, variables: { address } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) fail(`Preprod indexer returned HTTP ${response.status}`);
  const body = await response.json();
  if (body.errors?.length) fail(`Preprod indexer rejected deployment query: ${body.errors.map((item) => item.message).join("; ")}`);
  const action = body.data?.contractAction;
  if (!action) fail("No deployment action exists at this Preprod address.");
  const transaction = action.__typename === "ContractDeploy" ? action.transaction
    : action.__typename === "ContractCall" ? action.deploy?.transaction : null;
  if (!transaction) fail(`Address action ${action.__typename ?? "unknown"} is not a deployment.`);
  return transaction;
}

async function verify(address, txId) {
  setNetworkId("preprod");
  const transaction = await deploymentTransaction(address);
  if (!transaction.identifiers?.some((identifier) => identifier.toLowerCase() === txId)) {
    fail("The supplied transaction ID does not identify this contract deployment.");
  }
  if (transaction.transactionResult?.status !== "SUCCESS" || !Number.isInteger(transaction.block?.height)) {
    fail(`Deployment is not a finalized full success (status: ${transaction.transactionResult?.status ?? "unavailable"}).`);
  }

  const provider = indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS);
  const deployed = await provider.queryDeployContractState(address);
  if (!deployed) fail("The indexer did not return a deployment contract state.");
  const keys = await Promise.all(CIRCUITS.map(async (id) => {
    const path = fileURLToPath(new URL(`../../public/zk/kairos/keys/${id}.verifier`, import.meta.url));
    return [id, createVerifierKey(await readFile(path))];
  }));
  verifyContractState(keys, deployed);
  const initial = ledger(deployed.data);
  if (initial.round !== 1n || initial.phase !== 0n || initial.roundCloseAt <= 0n) {
    fail("Deployment state does not match the current Kairos constructor.");
  }
  const latestState = await provider.queryContractState(address);
  if (!latestState) fail("The indexer did not return current public contract state.");
  const latest = ledger(latestState.data);
  return {
    network: "preprod",
    contractAddress: address,
    deploymentTxId: txId,
    deploymentStatus: transaction.transactionResult.status,
    deploymentBlock: transaction.block.height,
    deploymentTimestamp: transaction.block.timestamp,
    currentArtifactCircuits: CIRCUITS.length,
    firstRoundCloseAt: initial.roundCloseAt.toString(),
    currentRound: latest.round.toString(),
    currentPhase: latest.phase.toString(),
    currentRoundCloseAt: latest.roundCloseAt.toString(),
    economyIssued: latest.economyIssued,
  };
}

const [addressInput, txInput] = process.argv.slice(2);
if (!addressInput || !txInput || !HEX_32.test(addressInput) || !TX_IDENTIFIER.test(txInput)) {
  console.error("Usage: npm run verify:preprod -- <64-hex-contract-address> <64-or-66-hex-deployment-tx-id>");
  process.exitCode = 2;
} else {
  verify(addressInput.toLowerCase(), txInput.toLowerCase())
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(`Preprod deployment verification failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}
