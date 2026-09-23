// Midnight.js 4.1.1 expects isomorphic-ws.WebSocket, while its browser entry
// exports only a default. The browser native WebSocket is the required shape.
export const WebSocket = globalThis.WebSocket;
export default WebSocket;
