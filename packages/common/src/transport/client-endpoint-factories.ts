import { ConnectionId } from "../aliases.js";
import { QUERY_PARAMS } from "../servers/query-params.js";
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

export class BrowserWebSocketClientConnectionEndpointFactory
  implements ClientRemoteConnectionEndpointFactory
{
  createRemoteEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    const ws = new WebSocket(urlWithQueryParams(url, queryParams));
    return new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
  }
}

export class TestBrowserWebSocketClientConnectionEndpointFactory
  implements ClientRemoteConnectionEndpointFactory
{
  constructor(private testAuthId?: string) {}

  createRemoteEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    const ws = new WebSocket(
      urlWithQueryParams(url, [
        ...queryParams,
        { name: QUERY_PARAMS.UNTRUSTED_AUTH_SESSION_ID, value: this.testAuthId || "" },
      ])
    );
    return new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
  }
}
