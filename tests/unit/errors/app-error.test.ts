import { describe, expect, it } from "vitest";
import { AppError, toSafeErrorMessage } from "@/lib/errors/app-error";

describe("AppError", () => {
  it("keeps stable error codes and safe messages", () => {
    const error = new AppError("EXAMPLE", "Safe message", { cause: new Error("raw") });
    expect(error.code).toBe("EXAMPLE");
    expect(toSafeErrorMessage(error)).toBe("Safe message");
  });

  it("does not expose unknown errors", () => {
    expect(toSafeErrorMessage(new Error("database password leaked"))).not.toContain("password");
  });
});
