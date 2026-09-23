type LogLevel = "debug" | "info" | "warn" | "error";
type Metadata = Record<string, unknown>;

const BLOCKED_KEYS = /(?:secret|seed|private.?key|witness|mnemonic|token|password|proof.?input)/i;

function sanitize(metadata: Metadata | undefined): Metadata | undefined {
  if (!metadata) return undefined;

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, BLOCKED_KEYS.test(key) ? "[REDACTED]" : value]),
  );
}

function write(level: LogLevel, event: string, metadata?: Metadata) {
  const payload = {
    level,
    event,
    at: new Date().toISOString(),
    ...sanitize(metadata),
  };

  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.info(line);
}

export const logger = {
  debug: (event: string, metadata?: Metadata) => write("debug", event, metadata),
  info: (event: string, metadata?: Metadata) => write("info", event, metadata),
  warn: (event: string, metadata?: Metadata) => write("warn", event, metadata),
  error: (event: string, metadata?: Metadata) => write("error", event, metadata),
};
