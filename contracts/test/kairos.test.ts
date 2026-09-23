import { createCircuitContext, createConstructorContext, sampleContractAddress } from "@midnight-ntwrk/compact-runtime";
import { describe, expect, it } from "vitest";
import { Contract, ledger, type Opening } from "../managed/kairos/contract/index.js";

const contractAddress = sampleContractAddress();
const coinPublicKey = { bytes: new Uint8Array(32) };

function opening(side: bigint, marker: number): Opening {
  const salt = new Uint8Array(32);
  salt.fill(marker);
  return { side, salt };
}

function setup() {
  const contract = new Contract({});
  const initial = contract.initialState(createConstructorContext({}, coinPublicKey));
  let context = createCircuitContext(contractAddress, coinPublicKey, initial.currentContractState, {});
  return {
    contract,
    state: () => ledger(context.currentQueryContext.state),
    commit(value: Opening) {
      context = contract.circuits.commitPosition(context, ledger(context.currentQueryContext.state).round, value.side, value.salt).context;
    },
    resolve(values: Opening[]) {
      context = contract.circuits.resolveRound(context, values).context;
    },
    next() {
      context = contract.circuits.startNextRound(context).context;
    },
    commitForRound(round: bigint, value: Opening) {
      context = contract.circuits.commitPosition(context, round, value.side, value.salt).context;
    },
  };
}

describe("Kairos bounded private market", () => {
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
});
