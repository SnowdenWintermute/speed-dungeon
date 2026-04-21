import { ConnectionId } from "../aliases.js";
import { urlWithQueryParams } from "../utils/url-with-query-params.js";
import { BrowserWebSocketConnectionEndpoint } from "./browser-websocket-connection-endpoint.js";
import { ConnectionEndpoint } from "./connection-endpoint.js";

export interface ClientRemoteConnectionEndpointFactory {
  createRemoteEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ): ConnectionEndpoint;
}

export class BrowserWebsocketClientConnectionEndpointFactory
  implements ClientRemoteConnectionEndpointFactory
{
  createRemoteEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    console.log("websocket connecting to url:", urlWithQueryParams(url, queryParams));
    const ws = new WebSocket(urlWithQueryParams(url, queryParams));
    return new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
  }
}
