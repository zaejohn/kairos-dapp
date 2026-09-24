import type { MidnightProvider, ProofProvider, WalletProvider } from "@midnight-ntwrk/midnight-js-types";

export type TransactionStage = "preparing" | "proving" | "balancing" | "submitting" | "finalizing";

export interface TransactionProgress {
  stage: TransactionStage;
  submittedTxId?: string;
}

interface TransactionProviders {
  proofProvider: ProofProvider;
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
}

export function withTransactionProgress(providers: TransactionProviders, onProgress: (progress: TransactionProgress) => void): TransactionProviders {
  return {
    proofProvider: {
      proveTx(tx, config) {
        onProgress({ stage: "proving" });
        return providers.proofProvider.proveTx(tx, config);
      },
    },
    walletProvider: {
      getCoinPublicKey: () => providers.walletProvider.getCoinPublicKey(),
      getEncryptionPublicKey: () => providers.walletProvider.getEncryptionPublicKey(),
      balanceTx(tx, ttl) {
        onProgress({ stage: "balancing" });
        return providers.walletProvider.balanceTx(tx, ttl);
      },
    },
    midnightProvider: {
      async submitTx(tx) {
        onProgress({ stage: "submitting" });
        const txId = await providers.midnightProvider.submitTx(tx);
        onProgress({ stage: "finalizing", submittedTxId: txId });
        return txId;
      },
    },
  };
}
