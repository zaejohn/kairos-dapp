import { rm } from "node:fs/promises";

for (const path of [".next", "coverage", "playwright-report", "test-results"]) {
  await rm(path, { recursive: true, force: true });
  console.log(`Removed ${path}`);
}

console.log("Compact generated artifacts were preserved. Remove contracts/managed explicitly only when you intend to recompile them.");
