#!/usr/bin/env node
/**
 * Copy the compiled ZK assets into ./public so the browser can fetch them.
 *
 * The prover/verifier keys and the zkir are what the local proof server needs in
 * order to generate a proof. midnight-js's FetchZkConfigProvider loads them over
 * HTTP from the dApp's own origin, so they have to be served as static files.
 *
 * Layout produced (relative to public/zk):
 *   keys/<circuit>.prover
 *   keys/<circuit>.verifier
 *   zkir/<circuit>.zkir
 *
 * Run after `compact compile`.
 */

import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const managedDir = join(root, 'managed', 'kairos');
const target = join(root, 'public', 'zk');

const fail = (message) => {
  console.error(`sync-zk: ${message}`);
  process.exit(1);
};

if (!existsSync(managedDir)) {
  fail(
    `compiled artifacts not found at ${managedDir}. Run "npm run compile" first ` +
      '(requires the Compact toolchain on PATH).',
  );
}

// Rebuild from scratch so a circuit removed from the contract cannot linger in
// the served assets and shadow the current build.
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

let copied = 0;
for (const dir of ['keys', 'zkir']) {
  const source = join(managedDir, dir);
  if (!existsSync(source)) fail(`expected ${source} to exist`);

  const destination = join(target, dir);
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });

  const entries = await readdir(destination);
  if (entries.length === 0) fail(`${dir} is empty`);
  copied += entries.length;

  const sample = await stat(join(destination, entries[0]));
  if (sample.size === 0) fail(`${dir}/${entries[0]} is empty`);
}

console.log(`sync-zk: copied ${copied} files to public/zk`);
