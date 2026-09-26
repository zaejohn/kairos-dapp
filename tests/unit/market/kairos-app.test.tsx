import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { KairosApp } from "@/components/kairos-app";
import type { MarketSnapshot } from "@/lib/midnight/market-client";

const readPublicMarket = vi.hoisted(() => vi.fn());
vi.mock("@/lib/midnight/market-client", () => ({ readPublicMarket }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/components/night-market-chart", () => ({ NightMarketChart: () => null }));

HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute("open", ""); };
HTMLDialogElement.prototype.close ??= function () { this.removeAttribute("open"); };

afterEach(() => {
  cleanup();
  readPublicMarket.mockReset();
  vi.unstubAllGlobals();
});

const publicState = (round: bigint): MarketSnapshot => ({
  round, roundCloseAt: 2_000_000_000n, phase: 0n, positions: 0n, winner: 2n, targetA: 50n, targetB: 50n,
  economyIssued: false, quoteAColor: "", quoteBColor: "", kaiColor: "",
  reserveA: 0n, reserveB: 0n, feePool: 0n, kaiDistributed: 0n,
  buyFeeA: 300n, buyFeeB: 300n, sellFeeA: 500n, sellFeeB: 500n,
  treasuryActionCount: 0n, recentTreasuryActions: [],
});

it("explains a pending public read and lets the user recover in Trading Engine", async () => {
  let finishInitial: (value: MarketSnapshot) => void = () => { throw new Error("Initial read not started"); };
  readPublicMarket.mockImplementationOnce(() => new Promise<MarketSnapshot>((resolve) => { finishInitial = resolve; }));
  readPublicMarket.mockResolvedValueOnce(publicState(2n));
  render(<KairosApp initialContractAddress={"a".repeat(64)} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Trading Engine" }));
  expect(screen.getByText(/Loading public market state from Preprod/)).toBeInTheDocument();
  await waitFor(() => expect(readPublicMarket).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "Refresh market state" }));
  expect(await screen.findByText(/Public market state loaded/)).toBeInTheDocument();
  await act(async () => finishInitial(publicState(1n)));
  expect(within(screen.getByRole("region", { name: "Market status" })).getByText("02")).toBeInTheDocument();
});

it("offers a public read retry after failure without requiring a wallet", async () => {
  readPublicMarket.mockRejectedValueOnce(new Error("Offline"));
  readPublicMarket.mockResolvedValueOnce(publicState(1n));
  render(<KairosApp initialContractAddress={"a".repeat(64)} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Trading Engine" }));
  expect(await screen.findByText(/Public market state could not be refreshed/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Refresh market state" }));
  expect(await screen.findByText(/Public market state loaded/)).toBeInTheDocument();
});

it("explains an unavailable configured Preprod contract", async () => {
  readPublicMarket.mockRejectedValue(new Error("Indexer unavailable"));
  render(<KairosApp initialContractAddress={"a".repeat(64)} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Settings" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the configured Preprod contract");
});

it("rejects a reachable proof server with the wrong version", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(url.endsWith("/version") ? "8.0.0" : "OK")));
  render(<KairosApp initialContractAddress="" />);
  fireEvent.click(screen.getByRole("button", { name: "Open Settings" }));
  fireEvent.click(screen.getByRole("button", { name: "Check local proof server" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Cannot confirm proof server 8.1.0");
  expect(screen.getByText(/Proof server on this device: unavailable/)).toBeInTheDocument();
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
  render(<KairosApp initialContractAddress={addressA} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Settings" }));
  await waitFor(() => expect(readPublicMarket).toHaveBeenCalledWith(addressA));
  fireEvent.click(screen.getByText("Local developer controls"));
  fireEvent.change(screen.getByLabelText("Preprod contract address"), { target: { value: addressB } });
  fireEvent.click(screen.getByRole("button", { name: "Load public state" }));
  await waitFor(() => expect(readPublicMarket).toHaveBeenCalledWith(addressB));
  await act(async () => resolveB(publicState(2n)));
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  fireEvent.click(screen.getByRole("button", { name: "Open Trading Engine" }));
  const marketStatus = screen.getByRole("region", { name: "Market status" });
  await waitFor(() => expect(within(marketStatus).getByText("02")).toBeInTheDocument());
  await act(async () => resolveA(publicState(1n)));
  expect(within(marketStatus).getByText("02")).toBeInTheDocument();
  expect(within(marketStatus).queryByText("01")).not.toBeInTheDocument();
});

it("quotes the public asymmetric fee and keeps trading gated on a wallet", async () => {
  const address = "a".repeat(64);
  readPublicMarket.mockResolvedValue({ ...publicState(1n), economyIssued: true, buyFeeA: 100n, sellFeeA: 700n });
  render(<KairosApp initialContractAddress={address} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Trading Engine" }));
  await waitFor(() => expect(screen.getByText("Issued")).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("Gross amount in atomic units"), { target: { value: "10000" } });
  expect(screen.getByText(/100 units \(100 bps\)/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sell quote" }));
  expect(screen.getByText(/700 units \(700 bps\)/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sell Quote A" })).toBeDisabled();
});

it("shows the treasury step when a resolved round has unapplied reserves", async () => {
  const address = "a".repeat(64);
  readPublicMarket.mockResolvedValue({ ...publicState(1n), phase: 2n, targetA: 70n, targetB: 30n, reserveA: 9_700n, reserveB: 9_700n });
  render(<KairosApp initialContractAddress={address} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Trading Engine" }));
  expect(await screen.findByText("Restore the target allocation in Treasury after intervening trades before starting the next round.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Start next round" })).toBeDisabled();
});

it("shows a missed deadline and prevents new position preparation", async () => {
  const address = "a".repeat(64);
  readPublicMarket.mockResolvedValue({ ...publicState(1n), roundCloseAt: 1_700_000_000n });
  render(<KairosApp initialContractAddress={address} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Trading Engine" }));
  expect(await within(screen.getByRole("region", { name: "Market status" })).findByText("Expiry available")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Prepare private opening" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Expire missed round" })).toBeDisabled();
});

it("shows only recorded public treasury actions", async () => {
  const address = "a".repeat(64);
  readPublicMarket.mockResolvedValue({ ...publicState(2n), phase: 2n, treasuryActionCount: 1n, recentTreasuryActions: [{ index: 0n, round: 1n, kind: 0n, winner: 0n, targetA: 70n, targetB: 30n, reserveA: 700n, reserveB: 300n, feePool: 20n }] });
  render(<KairosApp initialContractAddress={address} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Treasury" }));
  expect(await screen.findByText("Resolution · Quote A")).toBeInTheDocument();
  expect(screen.getByText("700 / 300 atomic NIGHT")).toBeInTheDocument();
});
