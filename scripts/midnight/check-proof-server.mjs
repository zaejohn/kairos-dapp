const baseUrl = process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6301";
const expectedVersion = "8.1.0";

async function read(path) {
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

try {
  const [health, version, ready] = await Promise.all([read("/health"), read("/version"), read("/ready")]);
  const versionText = typeof version === "string" ? version : JSON.stringify(version);

  if (!versionText.includes(expectedVersion)) {
    throw new Error(`Expected proof server ${expectedVersion}; received ${versionText}`);
  }

  console.log(JSON.stringify({ ok: true, baseUrl, health, version, ready }, null, 2));
} catch (error) {
  console.error(`Proof server check failed at ${baseUrl}.`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
