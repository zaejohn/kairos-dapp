/**
 * Midnight network configuration.
 *
 * Endpoint paths and network id strings are taken from the official
 * networks-and-environments reference. Note the indexer path is `/api/v4/graphql`
 * — older examples in the wild still use the retired v3 path.
 *
 * Proof generation always runs against a local proof server at
 * `http://localhost:6300`. KAIROS proves locally rather than delegating to the
 * wallet's own prover so that witness data never leaves the user's machine.
 */

export type NetworkId = 'undeployed' | 'preview' | 'preprod';

export type NetworkConfig = {
  readonly networkId: NetworkId;
  /** GraphQL indexer used to read public contract state. */
  readonly indexerUri: string;
  readonly indexerWsUri: string;
  /** Midnight node RPC endpoint. */
  readonly nodeRpcUri: string;
  /** Local proof server; proofs never leave the user's machine. */
  readonly proofServerUri: string;
  readonly label: string;
  readonly explorerUri?: string;
  readonly faucetUri?: string;
};

const PROOF_SERVER_URI = 'http://localhost:6300';

export const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  preprod: {
    networkId: 'preprod',
    indexerUri: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUri: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    nodeRpcUri: 'https://rpc.preprod.midnight.network',
    proofServerUri: PROOF_SERVER_URI,
    label: 'Preprod',
    explorerUri: 'https://preprod.midnightexplorer.com/',
    faucetUri: 'https://midnight-tmnight-preprod.nethermind.dev/',
  },
  preview: {
    networkId: 'preview',
    indexerUri: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWsUri: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    nodeRpcUri: 'https://rpc.preview.midnight.network',
    proofServerUri: PROOF_SERVER_URI,
    label: 'Preview',
    explorerUri: 'https://preview.midnightexplorer.com/',
    faucetUri: 'https://midnight-tmnight-preview.nethermind.dev/',
  },
  undeployed: {
    networkId: 'undeployed',
    indexerUri: 'http://localhost:8088/api/v4/graphql',
    indexerWsUri: 'ws://localhost:8088/api/v4/graphql/ws',
    nodeRpcUri: 'http://localhost:9944',
    proofServerUri: PROOF_SERVER_URI,
    label: 'Local (undeployed)',
  },
};

/**
 * The network this build targets. Preprod is the public testnet the Midnight
 * docs recommend for development, so it is the default.
 */
export const DEFAULT_NETWORK_ID: NetworkId =
  (process.env.NEXT_PUBLIC_NETWORK_ID as NetworkId | undefined) ?? 'preprod';

export const getNetworkConfig = (networkId: NetworkId = DEFAULT_NETWORK_ID): NetworkConfig =>
  NETWORK_CONFIGS[networkId] ?? NETWORK_CONFIGS.preprod;

/**
 * Address of the deployed KAIROS contract.
 *
 * Deploying writes the address here through NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS.
 * It is intentionally empty by default: an unset address means "not deployed
 * yet", and the UI offers deployment rather than pretending a contract exists.
 * This value is never invented — it is only ever set from a real deployment.
 */
export const KAIROS_CONTRACT_ADDRESS: string | undefined =
  process.env.NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS || undefined;
