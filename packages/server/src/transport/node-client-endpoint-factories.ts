import {
  CLIENT_CONNECTION_ENDPOINT_NIL_ID,
  ClientRemoteConnectionEndpointFactory,
  ConnectionEndpoint,
  urlWithQueryParams,
} from "@speed-dungeon/common";
import WebSocket, { ClientOptions } from "ws";
import { NodeWebSocketConnectionEndpoint } from "./node-websocket-connection-endpoint.js";

export class NodeWebSocketClientConnectionEndpointFactory
  implements ClientRemoteConnectionEndpointFactory
{
  constructor(private readonly clientOptions: ClientOptions = {}) {}

  createRemoteEndpoint(
    url: string,
    queryParams: { name: string; value: string }[]
  ): ConnectionEndpoint {
    const ws = new WebSocket(urlWithQueryParams(url, queryParams), this.clientOptions);
    return new NodeWebSocketConnectionEndpoint(ws, CLIENT_CONNECTION_ENDPOINT_NIL_ID);
  }
}
