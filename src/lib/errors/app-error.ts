export class AppError extends Error {
  readonly code: string;
  override readonly cause?: unknown;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.cause = options?.cause;
  }
}

export function toSafeErrorMessage(cause: unknown): string {
  if (cause instanceof AppError) return cause.message;
  return "Something went wrong. Check the local logs and retry.";
}
