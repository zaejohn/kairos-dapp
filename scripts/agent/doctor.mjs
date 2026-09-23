import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "AGENTS.md",
  ".codex/config.toml",
  "docs/engineering/DEFINITION_OF_DONE.md",
  "docs/midnight/VERSIONS.md",
  "package.json",
];

let failed = false;
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor !== 22) {
  console.error(`FAIL Node.js 22 required; current ${process.versions.node}`);
  failed = true;
} else {
  console.log(`PASS Node.js ${process.versions.node}`);
}

for (const file of requiredFiles) {
  try {
    await access(file);
    console.log(`PASS ${file}`);
  } catch {
    console.error(`FAIL missing ${file}`);
    failed = true;
  }
}

function optionalCommand(label, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    console.warn(`WARN ${label} unavailable`);
    return;
  }
  const output = `${result.stdout ?? ""} ${result.stderr ?? ""}`.trim().split("\n")[0];
  console.log(`PASS ${label}${output ? `: ${output}` : ""}`);
}

optionalCommand("Git", "git", ["--version"]);
optionalCommand("Docker", "docker", ["--version"]);
optionalCommand("Compact", "compact", ["compile", "--version"]);

if (failed) process.exit(1);
