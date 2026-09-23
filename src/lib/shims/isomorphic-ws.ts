/**
 * Browser shim for `isomorphic-ws`.
 *
 * midnight-js's indexer provider does `import * as ws from 'isomorphic-ws'` and
 * then reads `ws.WebSocket`. The package's browser build only provides a default
 * export, so that named import fails to resolve in a client bundle.
 *
 * In the browser the platform already provides a WebSocket implementation, so
 * this shim simply re-exports it under the shape the provider expects.
 *
 * Wired up through `turbopack.resolveAlias` in next.config.ts.
 */

const WebSocketImpl = globalThis.WebSocket;

export { WebSocketImpl as WebSocket };
export default WebSocketImpl;
