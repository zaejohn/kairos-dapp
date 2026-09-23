# Errors and Logging

## Errors

Third-party and infrastructure boundaries throw `AppError` with:

- a stable machine-readable `code`;
- a safe user-facing `message`;
- an optional `cause` retained locally;
- small non-secret metadata when useful.

Do not expose raw SDK errors to users by default.

## Logs

Use structured events, for example:

```ts
logger.info("wallet.connected", { network: "preprod" });
```

Never log:

- wallet seed phrases or private keys;
- witnesses/private state;
- signing material;
- access tokens/API keys;
- proof payloads containing sensitive inputs;
- full request bodies by default.

A log line should help answer what operation happened, where, and with what safe state—not reproduce private data.
