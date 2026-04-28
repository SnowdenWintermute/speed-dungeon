import {
  CLIENT_CONNECTION_ENDPOINT_NIL_ID,
  ClientRemoteConnectionEndpointFactory,
  ConnectionEndpoint,
  urlWithQueryParams,
} from "@speed-dungeon/common";
import WebSocket, { ClientOptions } from "ws";
import { NodeWebSocketConnectionEndpoint } from "./node-websocket-connection-endpoint.js";
import { BrowserTimingConnectionEndpoint } from "./browser-timing-endpoint.js";

// could probably delete this, it is from when we were trying to send headers
// in vitest and couldn't do that with the browser websockets we are using,
// but trying to use node websockets messed up all the test timings

export class NodeWebSocketClientConnectionEndpointFactory
  implements ClientRemoteConnectionEndpointFactory
{
  constructor(private readonly clientOptions: ClientOptions = {}) {}

  createRemoteEndpoint(
    url: string,
    queryParams: { name: string; value: string }[]
  ): ConnectionEndpoint {
    const ws = new WebSocket(urlWithQueryParams(url, queryParams), this.clientOptions);
    const inner = new NodeWebSocketConnectionEndpoint(ws, CLIENT_CONNECTION_ENDPOINT_NIL_ID);
    const wrappedWithBrowserTiming = new BrowserTimingConnectionEndpoint(inner);
    return wrappedWithBrowserTiming;
  }
}
