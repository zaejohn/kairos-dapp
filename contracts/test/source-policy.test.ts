import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const contractPath = new URL("../src/hello-world.compact", import.meta.url);

describe("demo Compact source", () => {
  it("pins the supported language version and labels its public disclosure", async () => {
    const source = await readFile(contractPath, "utf8");
    expect(source).toContain("pragma language_version 0.23;");
    expect(source).toContain("DEMO ONLY");
    expect(source).toContain("disclose(newMessage)");
  });
});
