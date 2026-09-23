import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logging/logger";

afterEach(() => vi.restoreAllMocks());

describe("logger", () => {
  it("redacts secret-shaped metadata keys", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("test.event", { network: "preprod", privateKey: "never-log-me" });

    expect(spy).toHaveBeenCalledOnce();
    const output = String(spy.mock.calls[0]?.[0]);
    expect(output).toContain('"network":"preprod"');
    expect(output).toContain('"privateKey":"[REDACTED]"');
    expect(output).not.toContain("never-log-me");
  });
});
