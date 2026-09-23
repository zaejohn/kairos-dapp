import { cp, mkdir, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const EXPECTED_COMPILER_VERSION = "0.31.1";
const sourceDir = join(process.cwd(), "contracts", "src");
const outputRoot = join(process.cwd(), "contracts", "managed");
const browserArtifacts = join(process.cwd(), "public", "zk");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error) throw result.error;
  return result;
}

const onWindows = process.platform === "win32";
const wslCompiler = onWindows ? run("wsl", ["--", "bash", "-lc", "command -v compact"]) : null;
if (wslCompiler && (wslCompiler.status !== 0 || !wslCompiler.stdout.trim())) {
  throw new Error("Compact is unavailable in WSL. Install the 0.31.x compiler in the default Linux distribution.");
}
function compact(args, options = {}) {
  return spawnSync(
    onWindows ? "wsl" : "compact",
    onWindows ? ["--", wslCompiler.stdout.trim(), ...args] : args,
    options,
  );
}

function compilerPath(path) {
  if (!onWindows) return path;
  const converted = run("wsl", ["--", "wslpath", "-u", path.replaceAll("\\", "/")]);
  if (converted.status !== 0) {
    throw new Error(`Cannot translate path for WSL Compact: ${path}`);
  }
  return converted.stdout.trim();
}

const version = compact(["compile", "--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
if (version.error) throw version.error;
if (version.status !== 0) {
  console.error(version.stderr || "Compact compiler is unavailable.");
  process.exit(version.status ?? 1);
}

const versionText = `${version.stdout}\n${version.stderr}`.trim();
if (versionText !== EXPECTED_COMPILER_VERSION) {
  console.error(`Expected Compact compiler ${EXPECTED_COMPILER_VERSION}, got: ${versionText}`);
  console.error(`Run: compact update ${EXPECTED_COMPILER_VERSION}`);
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
  const compiled = compact(["compile", compilerPath(input), compilerPath(output)], { stdio: "inherit" });
  if (compiled.error) throw compiled.error;
  if (compiled.status !== 0) process.exit(compiled.status ?? 1);
  const browserOutput = join(browserArtifacts, basename(entry.name, ".compact"));
  await mkdir(browserOutput, { recursive: true });
  await cp(join(output, "keys"), join(browserOutput, "keys"), { recursive: true });
  await cp(join(output, "zkir"), join(browserOutput, "zkir"), { recursive: true });
}

console.log(`Compiled ${entries.length} contract(s) with ${versionText}.`);
