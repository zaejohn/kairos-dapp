import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { MidnightBech32m, UnshieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";

// RFC 4180 fields, including escaped quotes and embedded newlines. Never log PII.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false, closed = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ",") {
      row.push(field); field = ""; closed = false;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && source[i + 1] === "\n") i++;
      rows.push([...row, field]); row = []; field = ""; closed = false;
    } else if (c === '"' && field === "" && !closed) quoted = true;
    else {
      if (closed || c === '"') throw new Error("Malformed CSV quoting");
      field += c;
    }
  }
  if (quoted) throw new Error("Unclosed CSV field");
  if (row.length || field || closed) rows.push([...row, field]);
  return rows;
}

export function normalizeDate(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid response timestamp");
  const [, month, day, year, hour, minute, second] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) throw new Error("Invalid response timestamp");
  // The CSV specifies no timezone; do not silently convert these local timestamps.
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function validateEvidence(bytes) {
  const [headers, ...rows] = parseCsv(bytes.toString("utf8"));
  const columns = ["Timestamp", "MIDNIGHT PREPROD WALLET ADDRESS", "MESSAGE"].map((name) => {
    if (headers.filter((header) => header === name).length !== 1) throw new Error("Missing or duplicated evidence column");
    return headers.indexOf(name);
  });
  if (rows.length !== 72) throw new Error("Expected exactly 72 response rows (CSV rows 2–73)");
  const seen = new Set();
  let previousDate = "";
  const responses = rows.map((row, index) => {
    const csvRow = index + 2;
    try {
      if (row.length !== headers.length) throw new Error("column alignment");
      const wallet = row[columns[1]];
      const address = MidnightBech32m.parse(wallet).decode(UnshieldedAddress, "preprod");
      if (MidnightBech32m.encode("preprod", address).asString() !== wallet) throw new Error("noncanonical address");
      if (seen.has(wallet)) throw new Error("duplicate address");
      seen.add(wallet);
      const timestamp = normalizeDate(row[columns[0]]);
      if (timestamp < previousDate) throw new Error("timestamp order");
      previousDate = timestamp;
      return { csvRow, level: index < 50 ? 5 : 6, user: index < 50 ? `L5-${index + 1}` : `L6-${index - 49}`, wallet, timestamp, feedback: row[columns[2]] };
    } catch {
      throw new Error(`Evidence validation failed at CSV row ${csvRow}; check address, duplicate, date, or column alignment`);
    }
  });
  return {
    source: "KAIROS (Responses) - Form Responses 1.csv",
    sourceSha256: createHash("sha256").update(bytes).digest("hex"),
    timestampTimezone: "Not specified in source; preserved without conversion",
    validation: { sdk: "@midnight-ntwrk/wallet-sdk-address-format@3.1.2", addressType: "Preprod unshielded", checksumAndDecode: 72, uniqueWallets: 72, duplicates: 0, level5: 50, level6: 22, nonblankFeedback: responses.filter((row) => row.feedback.trim()).length },
    evidenceBoundary: "The owner confirms these are real testers. Address validity and CSV row alignment are checked; the CSV contains no transaction IDs or wallet-control attestations.",
    responses,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: node scripts/verify-user-evidence.mjs <original.csv> [--write]");
  const report = validateEvidence(readFileSync(path));
  const output = "docs/evidence/user-feedback.json";
  const serialized = JSON.stringify(report, null, 2) + "\n";
  if (process.argv.includes("--write")) writeFileSync(output, serialized);
  else if (readFileSync(output, "utf8") !== serialized) throw new Error("Published evidence differs from the supplied CSV");
  console.log(JSON.stringify(report.validation));
}
