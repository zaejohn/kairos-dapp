import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { KairosApp } from "@/components/kairos-app";
import type { MarketSnapshot } from "@/lib/midnight/market-client";

const readPublicMarket = vi.hoisted(() => vi.fn());
vi.mock("@/lib/midnight/market-client", () => ({ readPublicMarket }));
vi.mock("next/image", () => ({ default: () => null }));

afterEach(() => {
  readPublicMarket.mockReset();
});

it("ignores an old contract response after the address changes", async () => {
  const addressA = "a".repeat(64);
  const addressB = "b".repeat(64);
  let resolveA: (value: MarketSnapshot) => void = () => { throw new Error("A was not requested"); };
  let resolveB: (value: MarketSnapshot) => void = () => { throw new Error("B was not requested"); };
  readPublicMarket.mockImplementation((address: string) => new Promise<MarketSnapshot>((resolve) => {
    if (address === addressA) resolveA = resolve;
    if (address === addressB) resolveB = resolve;
  }));
  const state = (round: bigint): MarketSnapshot => ({
    round, phase: 0n, positions: 0n, winner: 2n, targetA: 50n, targetB: 50n,
  });

  render(<KairosApp initialContractAddress={addressA} />);
  await waitFor(() => expect(readPublicMarket).toHaveBeenCalledWith(addressA));
  fireEvent.change(screen.getByLabelText("Preprod contract address"), { target: { value: addressB } });
  fireEvent.click(screen.getByRole("button", { name: "Load public state" }));
  await waitFor(() => expect(readPublicMarket).toHaveBeenCalledWith(addressB));
  await act(async () => resolveB(state(2n)));
  const marketStatus = screen.getByRole("region", { name: "Market status" });
  await waitFor(() => expect(within(marketStatus).getByText("02")).toBeInTheDocument());
  await act(async () => resolveA(state(1n)));
  expect(within(marketStatus).getByText("02")).toBeInTheDocument();
  expect(within(marketStatus).queryByText("01")).not.toBeInTheDocument();
});
