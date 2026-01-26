import { CLIENT_CONNECTION_ENDPOINT_NIL_ID } from "../servers/tests/fixtures/index.js";
import {
  InMemoryConnectionEndpointServer,
  InMemoryConnectionRequest,
} from "./in-memory-connection-endpoint-server.js";
import { InMemoryConnectionEndpoint } from "./in-memory-connection-endpoint.js";

export class InMemoryConnectionEndpointServerRegistry {
  private servers = new Map<string, InMemoryConnectionEndpointServer>();

  registerServer(address: string, server: InMemoryConnectionEndpointServer): void {
    this.servers.set(address, server);
  }

  connect(
    urlString: string,
    options?: {
      headers?: Record<string, string>;
    }
  ): InMemoryConnectionEndpoint {
    const url = new URL(urlString);
    const serverAddress = `${url.protocol}//${url.host}`;

    const server = this.servers.get(serverAddress);
    if (!server) throw new Error(`No server at: ${serverAddress}`);

    const clientEndpoint = new InMemoryConnectionEndpoint(CLIENT_CONNECTION_ENDPOINT_NIL_ID);

    // Create mock request with URL, headers, etc.
    const request: InMemoryConnectionRequest = {
      url: url.pathname + url.search, // Include query params
      headers: {
        host: url.host,
        ...options?.headers,
      },
      method: "GET",
    };

    server.acceptConnection(clientEndpoint, request);
    return clientEndpoint;
  }
}
