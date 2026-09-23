import { mkdir, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const EXPECTED_COMPILER_LINE = "0.31";
const sourceDir = join(process.cwd(), "contracts", "src");
const outputRoot = join(process.cwd(), "contracts", "managed");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error) throw result.error;
  return result;
}

const version = run("compact", ["compile", "--version"]);
if (version.status !== 0) {
  console.error(version.stderr || "Compact compiler is unavailable.");
  process.exit(version.status ?? 1);
}

const versionText = `${version.stdout}\n${version.stderr}`.trim();
if (!versionText.includes(EXPECTED_COMPILER_LINE)) {
  console.error(`Expected Compact compiler ${EXPECTED_COMPILER_LINE}.x, got: ${versionText}`);
  console.error("Run: compact update 0.31");
  process.exit(1);
}

await mkdir(outputRoot, { recursive: true });
const entries = (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".compact"))
  .sort((a, b) => a.name.localeCompare(b.name));

if (entries.length === 0) {
  console.error("No Compact contracts found in contracts/src.");
  process.exit(1);
}

for (const entry of entries) {
  const input = join(sourceDir, entry.name);
  const output = join(outputRoot, basename(entry.name, ".compact"));
  console.log(`Compiling ${entry.name} -> ${output}`);
  const compiled = spawnSync("compact", ["compile", input, output], { stdio: "inherit" });
  if (compiled.status !== 0) process.exit(compiled.status ?? 1);
}

console.log(`Compiled ${entries.length} contract(s) with ${versionText}.`);
