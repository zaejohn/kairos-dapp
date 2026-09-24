import { ContractState, createCircuitContext, createConstructorContext, decodeRawTokenType, encodeUserAddress, sampleContractAddress, sampleUserAddress } from "@midnight-ntwrk/compact-runtime";
import { describe, expect, it } from "vitest";
import { Contract, ledger, type Opening } from "../managed/kairos/contract/index.js";

const contractAddress = sampleContractAddress();
const coinPublicKey = { bytes: new Uint8Array(32) };
const recipient = { bytes: encodeUserAddress(sampleUserAddress()) };
const FIRST_CLOSE = 1_700_604_800;

function opening(side: bigint, marker: number): Opening {
  const salt = new Uint8Array(32);
  salt.fill(marker);
  return { side, salt };
}

function setup() {
  const contract = new Contract({});
  const initial = contract.initialState(createConstructorContext({}, coinPublicKey), BigInt(FIRST_CLOSE));
  let now = FIRST_CLOSE - 604_800;
  let context = createCircuitContext(contractAddress, coinPublicKey, initial.currentContractState, {}, undefined, undefined, now);
  let quoteAInventory = 1_000_000n;
  let quoteBInventory = 1_000_000n;
  // Circuit execution models state transitions, but it does not settle the
  // unshielded UTXOs between transactions. Supply the balances a settled
  // transaction would leave for the next circuit call.
  function settleBalances() {
    const publicState = ledger(context.currentQueryContext.state);
    const state = new ContractState();
    state.data = context.currentQueryContext.state;
    state.balance = new Map([
      [{ tag: "unshielded" as const, raw: "0".repeat(64) }, publicState.reserveA + publicState.reserveB + publicState.feePool],
      [{ tag: "unshielded" as const, raw: decodeRawTokenType(publicState.quoteAColor) }, quoteAInventory],
      [{ tag: "unshielded" as const, raw: decodeRawTokenType(publicState.quoteBColor) }, quoteBInventory],
      [{ tag: "unshielded" as const, raw: decodeRawTokenType(publicState.kaiColor) }, 1_000_000n - publicState.kaiDistributed],
    ]);
    context = createCircuitContext(contractAddress, coinPublicKey, state, {}, undefined, undefined, now);
  }
  function setTime(time: number) {
    now = time;
    if (ledger(context.currentQueryContext.state).economyIssued) settleBalances();
    else context = createCircuitContext(contractAddress, coinPublicKey, context.currentQueryContext.state, {}, undefined, undefined, now);
  }
  function targetCandidate(targetA: bigint) {
    const view = ledger(context.currentQueryContext.state);
    return ((view.reserveA + view.reserveB) * targetA) / 100n;
  }
  function resolutionCandidate(values: Opening[]) {
    const forA = values.filter((value) => value.side === 0n).length;
    const forB = values.filter((value) => value.side === 1n).length;
    const targetA = forA > forB ? 70n : forB > forA ? 30n : ledger(context.currentQueryContext.state).targetA;
    return targetCandidate(targetA);
  }
  return {
    contract,
    state: () => ledger(context.currentQueryContext.state),
    at(time: number) {
      setTime(time);
    },
    commit(value: Opening) {
      context = contract.circuits.commitPosition(context, ledger(context.currentQueryContext.state).round, value.side, value.salt).context;
    },
    resolve(values: Opening[]) {
      if (ledger(context.currentQueryContext.state).phase === 1n) setTime(Number(ledger(context.currentQueryContext.state).roundCloseAt));
      context = contract.circuits.resolveRound(context, values, resolutionCandidate(values)).context;
    },
    resolveNow(values: Opening[]) {
      context = contract.circuits.resolveRound(context, values, resolutionCandidate(values)).context;
    },
    resolveWithCandidate(values: Opening[], candidateA: bigint) {
      context = contract.circuits.resolveRound(context, values, candidateA).context;
    },
    expire() {
      context = contract.circuits.expireRound(context, targetCandidate(ledger(context.currentQueryContext.state).targetA)).context;
    },
    next() {
      context = contract.circuits.startNextRound(context).context;
    },
    commitForRound(round: bigint, value: Opening) {
      context = contract.circuits.commitPosition(context, round, value.side, value.salt).context;
    },
    issueEconomy() {
      context = contract.circuits.initializeEconomy(context).context;
      settleBalances();
    },
    buy(side: bigint, gross: bigint, fee: bigint) {
      context = contract.circuits.buyQuote(context, side, gross, fee, recipient).context;
      if (side === 0n) quoteAInventory -= gross - fee;
      else quoteBInventory -= gross - fee;
      settleBalances();
    },
    sell(side: bigint, gross: bigint, fee: bigint) {
      context = contract.circuits.sellQuote(context, side, gross, fee, recipient).context;
      if (side === 0n) quoteAInventory += gross;
      else quoteBInventory += gross;
      settleBalances();
    },
    rebalance(candidateA: bigint) {
      context = contract.circuits.rebalanceTreasury(context, candidateA).context;
    },
  };
}

describe("Kairos bounded private market", () => {
  it("rejects first close values that could wrap weekly deadline arithmetic", () => {
    const contract = new Contract({});
    expect(() => contract.initialState(createConstructorContext({}, coinPublicKey), 0n)).toThrow(/invalid first close/);
    expect(() => contract.initialState(createConstructorContext({}, coinPublicKey), 9_223_372_036_854_775_807n)).toThrow(/invalid first close/);
  });

  it("enforces the weekly close and expires missing openings after a one-day window", () => {
    const market = setup();
    expect(market.state().roundCloseAt).toBe(BigInt(FIRST_CLOSE));
    const positions = Array.from({ length: 8 }, (_, index) => opening(0n, index + 1));
    positions.forEach(market.commit);
    expect(() => market.resolveNow(positions)).toThrow(/round is still open/);
    market.at(FIRST_CLOSE);
    expect(() => market.commit(opening(1n, 9))).toThrow();
    market.resolveNow(positions);
    market.next();
    expect(market.state().roundCloseAt).toBe(BigInt(FIRST_CLOSE + 604_800));
    market.commit(opening(1n, 9));
    market.at(FIRST_CLOSE + 604_800 + 86_400);
    expect(() => market.commit(opening(0n, 10))).toThrow(/round is closed/);
    market.expire();
    expect([market.state().winner, market.state().phase]).toEqual([2n, 2n]);
    market.next();
    expect(market.state().roundCloseAt).toBe(BigInt(FIRST_CLOSE + 1_209_600));
  });

  it("closes the resolution window even for a complete round", () => {
    const market = setup();
    const positions = Array.from({ length: 8 }, (_, index) => opening(index < 5 ? 0n : 1n, index + 1));
    positions.forEach(market.commit);
    market.at(FIRST_CLOSE + 86_400);
    expect(() => market.resolveNow(positions)).toThrow(/resolution window expired/);
    market.expire();
    expect([market.state().winner, market.state().targetA, market.state().targetB]).toEqual([2n, 50n, 50n]);
  });

  it("restores the existing target when an incomplete round expires", () => {
    const market = setup();
    market.issueEconomy();
    market.buy(0n, 10_000n, 300n);
    market.commit(opening(0n, 1));
    market.at(FIRST_CLOSE + 86_400);
    market.expire();
    expect([market.state().reserveA, market.state().reserveB, market.state().feePool]).toEqual([4_850n, 4_850n, 300n]);
    market.next();
    expect(market.state().round).toBe(2n);
  });

  it("publishes only commitments until a complete round resolves", () => {
    const market = setup();
    const positions = Array.from({ length: 8 }, (_, index) => opening(index < 5 ? 0n : 1n, index + 1));
    positions.forEach(market.commit);
    expect(market.state().phase).toBe(1n);
    expect(market.state().commitments.size()).toBe(8n);
    expect(market.state().winner).toBe(2n);
    market.resolve(positions);
    expect(market.state().winner).toBe(0n);
    expect([market.state().targetA, market.state().targetB]).toEqual([70n, 30n]);
  });

  it("rejects an altered opening and a premature resolution", () => {
    const market = setup();
    const positions = Array.from({ length: 8 }, (_, index) => opening(index % 2 === 0 ? 0n : 1n, index + 1));
    market.commit(positions[0]!);
    expect(() => market.resolve(positions)).toThrow();
    positions.slice(1).forEach(market.commit);
    const altered = [...positions];
    altered[0] = opening(1n, 1);
    expect(() => market.resolve(altered)).toThrow();
    market.resolve(positions);
    expect(market.state().winner).toBe(2n);
  });

  it("prevents extra commitments and resets only after resolution", () => {
    const market = setup();
    const positions = Array.from({ length: 8 }, (_, index) => opening(1n, index + 1));
    expect(() => market.next()).toThrow();
    positions.forEach(market.commit);
    expect(() => market.commit(opening(0n, 9))).toThrow();
    market.resolve(positions);
    market.next();
    expect(market.state().round).toBe(2n);
    expect(market.state().commitments.size()).toBe(0n);
    expect(market.state().phase).toBe(0n);
  });

  it("rejects an opening prepared for an earlier round", () => {
    const market = setup();
    const positions = Array.from({ length: 8 }, (_, index) => opening(0n, index + 1));
    positions.forEach(market.commit);
    market.resolve(positions);
    market.next();
    expect(() => market.commitForRound(1n, opening(1n, 9))).toThrow();
    expect(market.state().nextIndex).toBe(0n);
  });

  it("issues three distinct contract token colors only once in local execution", () => {
    const market = setup();
    expect(market.state().economyIssued).toBe(false);
    market.issueEconomy();
    const first = market.state();
    expect(first.economyIssued).toBe(true);
    const colors = [first.quoteAColor, first.quoteBColor, first.kaiColor].map((color) => Buffer.from(color).toString("hex"));
    expect(new Set(colors).size).toBe(3);
    market.issueEconomy();
    const second = market.state();
    expect([second.quoteAColor, second.quoteBColor, second.kaiColor]).toEqual([first.quoteAColor, first.quoteBColor, first.kaiColor]);
  });

  it("charges exact asymmetric fees and conserves the NIGHT reserve accounting", () => {
    const market = setup();
    market.issueEconomy();
    expect(() => market.buy(0n, 10000n, 299n)).toThrow();
    market.buy(0n, 10000n, 300n);
    expect([market.state().reserveA, market.state().reserveB, market.state().feePool]).toEqual([9700n, 0n, 300n]);
    expect(() => market.sell(0n, 9000n, 449n)).toThrow();
    market.sell(0n, 9000n, 450n);
    expect([market.state().reserveA, market.state().reserveB, market.state().feePool]).toEqual([700n, 0n, 750n]);
    expect(market.state().kaiDistributed).toBe(750n);
  });

  it("rebalances internal NIGHT spending capacity to the resolved winner", () => {
    const market = setup();
    market.issueEconomy();
    market.buy(0n, 10000n, 300n);
    market.buy(1n, 10000n, 300n);
    const positions = Array.from({ length: 8 }, (_, index) => opening(index < 5 ? 0n : 1n, index + 1));
    positions.forEach(market.commit);
    market.at(FIRST_CLOSE);
    expect(() => market.resolveWithCandidate(positions, 13579n)).toThrow(/incorrect target allocation/);
    market.resolve(positions);
    expect([market.state().buyFeeA, market.state().buyFeeB, market.state().sellFeeA, market.state().sellFeeB]).toEqual([100n, 500n, 300n, 700n]);
    expect([market.state().reserveA, market.state().reserveB, market.state().feePool]).toEqual([13580n, 5820n, 600n]);
    market.buy(0n, 10000n, 100n);
    expect(() => market.next()).toThrow(/treasury target is not applied/);
    market.rebalance(20510n);
    market.next();
    expect(market.state().round).toBe(2n);
  });
});
