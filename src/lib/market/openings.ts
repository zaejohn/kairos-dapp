export interface SavedOpening {
  version: 1;
  contractAddress: string;
  round: number;
  side: 0 | 1;
  salt: string;
}

const HEX_32 = /^[0-9a-f]{64}$/i;
const CONTRACT_ADDRESS = /^[0-9a-f]{64}$/i;

export function isContractAddress(value: string): boolean {
  return CONTRACT_ADDRESS.test(value);
}

export function createOpening(contractAddress: string, round: number, side: 0 | 1): SavedOpening {
  if (!isContractAddress(contractAddress) || !Number.isSafeInteger(round) || round < 1) {
    throw new Error("A valid Preprod contract address and round are required.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return { version: 1, contractAddress, round, side, salt: [...salt].map((byte) => byte.toString(16).padStart(2, "0")).join("") };
}

export function parseOpening(input: unknown): SavedOpening {
  if (typeof input !== "object" || input === null) throw new Error("Opening must be an object.");
  const value = input as Record<string, unknown>;
  if (value.version !== 1 || typeof value.contractAddress !== "string" || !isContractAddress(value.contractAddress)
    || typeof value.round !== "number" || !Number.isSafeInteger(value.round) || value.round < 1
    || (value.side !== 0 && value.side !== 1) || typeof value.salt !== "string" || !HEX_32.test(value.salt)) {
    throw new Error("Opening has an invalid version, address, round, side, or salt.");
  }
  return {
    version: 1,
    contractAddress: value.contractAddress.toLowerCase(),
    round: value.round,
    side: value.side,
    salt: value.salt.toLowerCase(),
  };
}

export function parseResolutionBundle(text: string, contractAddress: string, round: bigint) {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.length !== 8) throw new Error("Exactly eight openings are required.");
  const openings = parsed.map(parseOpening);
  if (openings.some((opening) => opening.contractAddress !== contractAddress.toLowerCase() || BigInt(opening.round) !== round)) {
    throw new Error("Every opening must match the current contract and round.");
  }
  return openings.map((opening) => ({ side: BigInt(opening.side), salt: Uint8Array.from(opening.salt.match(/../g)!.map((byte) => Number.parseInt(byte, 16))) }));
}

export function openingSaltBytes(opening: SavedOpening): Uint8Array {
  return Uint8Array.from(opening.salt.match(/../g)!.map((byte) => Number.parseInt(byte, 16)));
}
