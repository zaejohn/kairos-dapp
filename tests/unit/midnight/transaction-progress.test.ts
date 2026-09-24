import type { MidnightProvider, ProofProvider, WalletProvider } from "@midnight-ntwrk/midnight-js-types";
import { describe, expect, it, vi } from "vitest";
import { withTransactionProgress, type TransactionProgress } from "@/lib/midnight/transaction-progress";

describe("transaction progress", () => {
  it("reports each provider boundary and waits for submission before reporting finalization", async () => {
    const progress: TransactionProgress[] = [];
    const unproven = { kind: "unproven" };
    const unbound = { kind: "unbound" };
    const finalized = { kind: "finalized" };
    let acceptSubmission: ((txId: string) => void) | undefined;
    const submission = new Promise<string>((resolve) => { acceptSubmission = resolve; });
    const proofProvider = { proveTx: vi.fn().mockResolvedValue(unbound) } as unknown as ProofProvider;
    const walletProvider = {
      getCoinPublicKey: vi.fn().mockReturnValue("coin"),
      getEncryptionPublicKey: vi.fn().mockReturnValue("encryption"),
      balanceTx: vi.fn().mockResolvedValue(finalized),
    } as unknown as WalletProvider;
    const midnightProvider = { submitTx: vi.fn().mockReturnValue(submission) } as unknown as MidnightProvider;
    const wrapped = withTransactionProgress({ proofProvider, walletProvider, midnightProvider }, (update) => progress.push(update));

    await wrapped.proofProvider.proveTx(unproven as unknown as Parameters<ProofProvider["proveTx"]>[0]);
    await wrapped.walletProvider.balanceTx(unbound as unknown as Parameters<WalletProvider["balanceTx"]>[0]);
    const pending = wrapped.midnightProvider.submitTx(finalized as unknown as Parameters<MidnightProvider["submitTx"]>[0]);
    expect(progress).toEqual([{ stage: "proving" }, { stage: "balancing" }, { stage: "submitting" }]);
    expect(proofProvider.proveTx).toHaveBeenCalledWith(unproven, undefined);
    expect(walletProvider.balanceTx).toHaveBeenCalledWith(unbound, undefined);
    expect(midnightProvider.submitTx).toHaveBeenCalledWith(finalized);

    acceptSubmission?.("tx-id");
    await expect(pending).resolves.toBe("tx-id");
    expect(progress).toEqual([{ stage: "proving" }, { stage: "balancing" }, { stage: "submitting" }, { stage: "finalizing", submittedTxId: "tx-id" }]);
  });

  it("does not show finalization after a failed submission", async () => {
    const progress: TransactionProgress[] = [];
    const cause = new Error("Lace rejected submission");
    const wrapped = withTransactionProgress({
      proofProvider: { proveTx: vi.fn() } as unknown as ProofProvider,
      walletProvider: { balanceTx: vi.fn() } as unknown as WalletProvider,
      midnightProvider: { submitTx: vi.fn().mockRejectedValue(cause) } as unknown as MidnightProvider,
    }, (update) => progress.push(update));

    await expect(wrapped.midnightProvider.submitTx({} as Parameters<MidnightProvider["submitTx"]>[0])).rejects.toBe(cause);
    expect(progress).toEqual([{ stage: "submitting" }]);
  });
});
