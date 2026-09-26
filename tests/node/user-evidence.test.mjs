import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MidnightBech32m, UnshieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import { normalizeDate, parseCsv, validateEvidence } from "../../scripts/verify-user-evidence.mjs";

test("CSV quoting preserves multiline feedback and empty final cells", () => {
  assert.deepEqual(parseCsv('a,b,c\r\n1,"two,\n""quoted""",\r\n'), [["a", "b", "c"], ["1", 'two,\n"quoted"', ""]]);
  assert.throws(() => parseCsv('a,"unfinished'));
  assert.throws(() => parseCsv('a,"closed"junk'));
});

test("dates reject overflow without assuming a timezone", () => {
  assert.equal(normalizeDate("9/26/2026 01:02:03"), "2026-09-26 01:02:03");
  assert.throws(() => normalizeDate("2/30/2026 01:02:03"));
  assert.throws(() => normalizeDate("9/26/2026 24:02:03"));
});

function sampleCsv(change = (row) => row) {
  const rows = Array.from({ length: 72 }, (_, index) => {
    const data = Buffer.alloc(32); data.writeUInt32BE(index, 28);
    const wallet = MidnightBech32m.encode("preprod", new UnshieldedAddress(data)).asString();
    return change(["9/26/2026 01:02:03", wallet, "test fixture"], index).join(",");
  });
  return Buffer.from(["Timestamp,MIDNIGHT PREPROD WALLET ADDRESS,MESSAGE", ...rows].join("\n"));
}

test("cohorts use exact source row boundaries; duplicates and invalid checksums fail closed", () => {
  const report = validateEvidence(sampleCsv());
  assert.equal(report.responses[49].csvRow, 51);
  assert.equal(report.responses[49].level, 5);
  assert.equal(report.responses[50].csvRow, 52);
  assert.equal(report.responses[50].level, 6);
  assert.equal(report.responses.at(-1).csvRow, 73);
  let first;
  assert.throws(() => validateEvidence(sampleCsv((row, index) => { first ??= row[1]; if (index === 50) row[1] = first; return row; })), /row 52/);
  assert.throws(() => validateEvidence(sampleCsv((row) => { row[1] += "q"; return row; })), /row 2/);
});

test("published user tables preserve every source wallet and normalized date in order", () => {
  const report = JSON.parse(readFileSync("docs/evidence/user-feedback.json", "utf8"));
  for (const [level, path] of [[5, "USERS.md"], [6, "LAUNCH_USERS.md"]]) {
    const entries = readFileSync(path, "utf8").split("\n").filter((line) => /^\| \d+ \|/.test(line));
    const rows = report.responses.filter((row) => row.level === level);
    assert.equal(entries.length, rows.length);
    rows.forEach((row, index) => assert.equal(entries[index], `| ${index + 1} | ${row.wallet} | ${row.timestamp.slice(0, 10)} |`));
  }
});
