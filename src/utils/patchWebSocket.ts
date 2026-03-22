/**
 * patchWebSocket.ts
 *
 * GLOBAL SIDE-EFFECT: patches WebSocket.prototype.send
 *
 * The Appwrite SDK starts a 20-second heartbeat (setInterval) when a realtime
 * subscription is opened.  If the WebSocket disconnects and starts reconnecting,
 * the heartbeat callback fires while `readyState === CONNECTING` and calls
 * `WebSocket.send()`, which throws `INVALID_STATE_ERR`.  In React Native, an
 * uncaught error inside a timer callback is surfaced as a fatal crash.
 *
 * This patch wraps `WebSocket.prototype.send` so any send attempted during
 * CONNECTING is silently dropped instead of throwing.  Dropping the ping is
 * safe: the server closes connections that miss heartbeats, which is exactly
 * what the SDK already handles via its reconnection logic.
 *
 * Import this module once at the top of the app entry point (_layout.tsx).
 */
export function patchWebSocketSend(): void {
  if (typeof WebSocket === "undefined") return;

  const _nativeSend = WebSocket.prototype.send;

  WebSocket.prototype.send = function (
    data: string | ArrayBuffer | ArrayBufferView | Blob,
  ) {
    if (this.readyState === WebSocket.CONNECTING) {
      // Drop the send — the heartbeat will retry after the socket opens.
      return;
    }
    return _nativeSend.call(this, data);
  };
}
