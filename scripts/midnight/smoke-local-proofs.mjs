import {
  ContractState,
  createCircuitContext,
  createConstructorContext,
  decodeRawTokenType,
  encodeUserAddress,
  proofDataIntoSerializedPreimage,
  sampleContractAddress,
  sampleUserAddress,
} from "@midnight-ntwrk/compact-runtime";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { Contract, ledger } from "../../contracts/managed/kairos/contract/index.js";

const proofServerUrl = "http://127.0.0.1:6301";
const contract = new Contract({});
const contractAddress = sampleContractAddress();
const coinPublicKey = { bytes: new Uint8Array(32) };
const recipient = { bytes: encodeUserAddress(sampleUserAddress()) };
const firstClose = 1_700_604_800;
let now = firstClose - 604_800;
const initial = contract.initialState(createConstructorContext({}, coinPublicKey), BigInt(firstClose));
const provider = httpClientProvingProvider(
  proofServerUrl,
  new NodeZkConfigProvider("./public/zk/kairos"),
  { timeout: 120_000 },
);
let context = createCircuitContext(contractAddress, coinPublicKey, initial.currentContractState, {}, undefined, undefined, now);
let quoteAInventory = 1_000_000n;
const quoteBInventory = 1_000_000n;
const proofs = [];

async function prove(circuit, result) {
  const { input, output, publicTranscript, privateTranscriptOutputs } = result.proofData;
  const preimage = proofDataIntoSerializedPreimage(input, output, publicTranscript, privateTranscriptOutputs, circuit);
  const checkOutputs = await provider.check(preimage, circuit);
  const proof = await provider.prove(preimage, circuit);
  if (checkOutputs.length === 0 || proof.length === 0) throw new Error(`${circuit} produced no check outputs or proof`);
  proofs.push({ circuit, checkOutputs: checkOutputs.length, proofBytes: proof.length });
  context = result.context;
}

function settleBalances() {
  const view = ledger(context.currentQueryContext.state);
  const state = new ContractState();
  state.data = context.currentQueryContext.state;
  state.balance = new Map([
    [{ tag: "unshielded", raw: "0".repeat(64) }, view.reserveA + view.reserveB + view.feePool],
    [{ tag: "unshielded", raw: decodeRawTokenType(view.quoteAColor) }, quoteAInventory],
    [{ tag: "unshielded", raw: decodeRawTokenType(view.quoteBColor) }, quoteBInventory],
    [{ tag: "unshielded", raw: decodeRawTokenType(view.kaiColor) }, 1_000_000n - view.kaiDistributed],
  ]);
  context = createCircuitContext(contractAddress, coinPublicKey, state, {}, undefined, undefined, now);
}

function opening(side, marker) {
  const salt = new Uint8Array(32);
  salt.fill(marker);
  return { side, salt };
}

try {
  await prove("initializeEconomy", contract.circuits.initializeEconomy(context));
  settleBalances();

  await prove("buyQuote", contract.circuits.buyQuote(context, 0n, 10_000n, 300n, recipient));
  quoteAInventory -= 9_700n;
  settleBalances();

  await prove("sellQuote", contract.circuits.sellQuote(context, 0n, 9_000n, 450n, recipient));
  quoteAInventory += 9_000n;
  settleBalances();

  const openings = Array.from({ length: 8 }, (_, index) => opening(index < 5 ? 0n : 1n, index + 1));
  await prove("commitPosition", contract.circuits.commitPosition(context, 1n, openings[0].side, openings[0].salt));
  for (const value of openings.slice(1)) {
    context = contract.circuits.commitPosition(context, 1n, value.side, value.salt).context;
  }
  now = firstClose;
  settleBalances();
  await prove("resolveRound", contract.circuits.resolveRound(context, openings, 490n));
  await prove("rebalanceTreasury", contract.circuits.rebalanceTreasury(context, 490n));
  await prove("startNextRound", contract.circuits.startNextRound(context));

  now = firstClose + 604_800 + 86_400;
  settleBalances();
  await prove("expireRound", contract.circuits.expireRound(context, 490n));

  console.log(JSON.stringify({ ok: true, network: "local proof server only", proofs }, null, 2));
} catch (error) {
  console.error("Local proof smoke check failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
