# Generation Validation Report

Generated: 2026-09-23

## Passed in the generation environment

- `package.json` parses as JSON.
- All `.codex/*.toml` and `.codex/agents/*.toml` parse as TOML.
- GitHub Actions, Dependabot, and proof-server Compose YAML parse successfully.
- Node.js 22 requirement is satisfied by the validation runtime (22.16.0).
- All custom `.mjs` automation scripts pass `node --check`.
- Required instruction/document paths referenced by the repository exist.
- Common private-key/secret patterns were scanned; no embedded secret material was found.
- `contracts/managed/` is absent from the distributable and ignored by Git.
- The demo Compact contract source is taken from the official current Hello World pattern and pins language 0.23.
- GitHub Actions were updated to current v7 major lines.

## Environment-limited checks

The artifact-generation sandbox could not complete an npm registry install before its network operation timed out. Therefore the following were **not falsely marked as passed** here:

- dependency resolution / `package-lock.json` generation;
- ESLint execution;
- TypeScript typecheck;
- Vitest execution through installed dependencies;
- Next.js production build;
- Playwright browser execution.

Docker and the Compact CLI were also unavailable in the generation runtime, so proof-server startup and actual Compact compilation were not executed here.

## First-run validation on a normal development machine

Run these commands immediately after extraction:

```bash
cp .env.example .env.local
npm install
npm run agent:doctor
npm run verify
npm run test:contracts
npx playwright install chromium
npm run test:e2e
```

For Midnight contract/proof work, then install Compact 0.5.1 + toolchain 0.31.x and Docker, and run:

```bash
npm run compact:compile
npm run proof:up
npm run proof:status
```

After the first successful `npm install`, commit the generated `package-lock.json`. CI automatically uses `npm ci` whenever the lockfile exists.
