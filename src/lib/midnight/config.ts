export const MIDNIGHT_NETWORKS = ["preprod"] as const;

export type MidnightNetwork = (typeof MIDNIGHT_NETWORKS)[number];

export function isMidnightNetwork(value: string): value is MidnightNetwork {
  return MIDNIGHT_NETWORKS.some((network) => network === value);
}

export function getMidnightNetwork(
  value: string | undefined = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK,
): MidnightNetwork {
  const candidate = value ?? "preprod";

  if (!isMidnightNetwork(candidate)) {
    throw new Error(
      `Unsupported NEXT_PUBLIC_MIDNIGHT_NETWORK=${candidate}. Expected one of: ${MIDNIGHT_NETWORKS.join(", ")}.`,
    );
  }

  return candidate;
}
