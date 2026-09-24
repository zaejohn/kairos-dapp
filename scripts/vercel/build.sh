#!/usr/bin/env bash
set -euo pipefail

node scripts/vercel/validate-env.mjs

# Generated contract JavaScript and public proving assets are ignored by Git.
# Rebuild both from the pinned Compact toolchain in every isolated Vercel build.
if ! command -v compact >/dev/null 2>&1; then
  installer="$(mktemp)"
  trap 'rm -f "$installer"' EXIT
  curl --proto '=https' --tlsv1.2 -LsSf \
    https://github.com/midnightntwrk/compact/releases/download/compact-v0.5.1/compact-installer.sh \
    -o "$installer"
  printf '%s  %s\n' '85e74a53ae4a67b31fa4d854f3b6ffb4c29f7c53e3372c5008b6a4729a8b4a73' "$installer" | sha256sum --check --status
  sh "$installer"
fi
export PATH="$HOME/.local/bin:$PATH"
compact update 0.31.1
npm run compact:compile
npm run test:contracts

if [[ "${VERCEL_ENV:-}" == "production" ]]; then
  npm run verify:preprod -- "$NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS" "$KAIROS_DEPLOYMENT_TX_ID"
fi

npm run build
