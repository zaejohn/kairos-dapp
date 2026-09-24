import { pathToFileURL } from "node:url";

const ADDRESS = /^[0-9a-f]{64}$/i;
const TX_ID = /^(?:[0-9a-f]{64}|[0-9a-f]{66})$/i;

export function validateNodeVersion(version) {
  const [major, minor] = version.split(".").map(Number);
  if (major !== 22 || !Number.isInteger(minor) || minor < 22) {
    throw new Error(`Node.js 22.22 or newer within 22.x is required for the Vercel build; found ${version}.`);
  }
}

export function validateVercelEnvironment(env) {
  if (!["production", "preview", "development"].includes(env.VERCEL_ENV)) {
    throw new Error("VERCEL_ENV is unavailable. Enable access to System Environment Variables in the Vercel project before building.");
  }
  if (env.NEXT_PUBLIC_MIDNIGHT_NETWORK !== "preprod") {
    throw new Error("Set NEXT_PUBLIC_MIDNIGHT_NETWORK=preprod for every Vercel environment.");
  }
  if (env.VERCEL_ENV !== "production") return { production: false };

  if (!ADDRESS.test(env.NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS ?? "")) {
    throw new Error("Production needs NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS: the verified 64-character Preprod contract address.");
  }
  if (!TX_ID.test(env.KAIROS_DEPLOYMENT_TX_ID ?? "")) {
    throw new Error("Production needs KAIROS_DEPLOYMENT_TX_ID: the finalized deployment transaction ID.");
  }
  let site;
  try {
    site = new URL(env.KAIROS_SITE_URL ?? "");
  } catch {
    throw new Error("Production needs KAIROS_SITE_URL: the public https:// production origin.");
  }
  if (site.protocol !== "https:" || !site.hostname || site.username || site.password || site.pathname !== "/" || site.search || site.hash) {
    throw new Error("KAIROS_SITE_URL must be an HTTPS origin without credentials, a path, query, or fragment.");
  }
  return { production: true, siteUrl: site.origin };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateNodeVersion(process.versions.node);
    const result = validateVercelEnvironment(process.env);
    console.log(result.production ? `Validated Preprod production configuration for ${result.siteUrl}.` : "Validated Preprod preview configuration.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
