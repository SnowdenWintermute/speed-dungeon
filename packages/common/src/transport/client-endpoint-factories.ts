import { ConnectionId } from "../aliases.js";
import { QUERY_PARAMS } from "../servers/query-params.js";
import { invariant } from "../utils/index.js";
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
  constructor(private _testAuthId?: string) {
    invariant(
      process.env.NODE_ENV !== "production",
      "Don't use query params to send id on a remote connection in production"
    );
  }

  set testAuthId(value: string) {
    this._testAuthId = value;
  }

  createRemoteEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    console.log(
      "creating TestBrowserWebSocketClientConnectionEndpointFactory with auth id:",
      this._testAuthId
    );
    const ws = new WebSocket(
      urlWithQueryParams(url, [
        ...queryParams,
        { name: QUERY_PARAMS.UNTRUSTED_AUTH_SESSION_ID, value: this._testAuthId || "" },
      ])
    );
    return new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
  }
}
