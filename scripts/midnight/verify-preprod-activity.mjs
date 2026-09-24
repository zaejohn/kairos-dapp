import { pathToFileURL } from "node:url";

const INDEXER_HTTP = "https://indexer.preprod.midnight.network/api/v4/graphql";
const HEX_32 = /^[0-9a-f]{64}$/i;
const TX_IDENTIFIER = /^(?:[0-9a-f]{64}|[0-9a-f]{66})$/i;
const CIRCUITS = new Set([
  "initializeEconomy", "buyQuote", "sellQuote", "commitPosition",
  "resolveRound", "expireRound", "rebalanceTreasury", "startNextRound",
]);
const TRANSACTION_QUERY = `query TransactionByIdentifier($identifier: HexEncoded) {
  transactions(offset: { identifier: $identifier }) {
    __typename
    hash
    block { height timestamp }
    contractActions {
      __typename
      ... on ContractCall { address entryPoint }
    }
    ... on RegularTransaction {
      identifiers
      transactionResult { status }
    }
  }
}`;

export async function verifyPreprodActivity(address, txId, circuitId, fetchImpl = fetch) {
  if (!HEX_32.test(address) || !TX_IDENTIFIER.test(txId) || !CIRCUITS.has(circuitId)) {
    throw new Error("Expected a 64-hex contract address, 64- or 66-hex transaction ID, and Kairos circuit ID.");
  }
  const response = await fetchImpl(INDEXER_HTTP, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: TRANSACTION_QUERY, variables: { identifier: txId.toLowerCase() } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Preprod indexer returned HTTP ${response.status}.`);
  const body = await response.json();
  if (body.errors?.length) {
    throw new Error(`Preprod indexer rejected transaction query: ${body.errors.map((item) => item.message).join("; ")}`);
  }
  const transaction = body.data?.transactions?.find((candidate) =>
    candidate.__typename === "RegularTransaction"
    && candidate.identifiers?.some((identifier) => identifier.toLowerCase() === txId.toLowerCase()),
  );
  if (!transaction) throw new Error("No finalized regular transaction has this identifier on Preprod.");
  if (transaction.transactionResult?.status !== "SUCCESS" || !Number.isInteger(transaction.block?.height)) {
    throw new Error(`Transaction is not a finalized full success (status: ${transaction.transactionResult?.status ?? "unavailable"}).`);
  }
  const call = transaction.contractActions?.find((action) =>
    action.__typename === "ContractCall"
    && action.address?.toLowerCase() === address.toLowerCase()
    && action.entryPoint === circuitId,
  );
  if (!call) throw new Error(`Transaction does not contain ${circuitId} on the supplied Kairos address.`);
  return {
    network: "preprod",
    contractAddress: address.toLowerCase(),
    transactionId: txId.toLowerCase(),
    circuitId,
    status: transaction.transactionResult.status,
    blockHeight: transaction.block.height,
    blockTimestampMs: transaction.block.timestamp,
    transactionHash: transaction.hash,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [address, txId, circuitId] = process.argv.slice(2);
  if (!address || !txId || !circuitId) {
    console.error("Usage: npm run verify:activity -- <64-hex-contract-address> <64-or-66-hex-transaction-id> <Kairos-circuit-id>");
    process.exitCode = 2;
  } else {
    verifyPreprodActivity(address, txId, circuitId)
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => {
        console.error(`Preprod activity verification failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
      });
  }
}
