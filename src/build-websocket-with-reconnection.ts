import { ClientOptions, WebSocket } from "ws";

export function buildWebSocketWithReconnection(url: string, options: ClientOptions, reconnectAfter: number): WebSocket {
  const ws = new WebSocket(url, options);

  ws.onclose = () => {
    setTimeout(() => {
      buildWebSocketWithReconnection(url, options, reconnectAfter);
    }, 1000);
  };

  setTimeout(() => ws.close(), reconnectAfter);
  
  return ws;
}