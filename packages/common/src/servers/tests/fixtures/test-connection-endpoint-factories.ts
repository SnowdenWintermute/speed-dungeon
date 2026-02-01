import { ConnectionEndpoint } from "../../../transport/connection-endpoint.js";
import WebSocket from "ws";
import { NodeWebSocketConnectionEndpoint } from "../../../transport/node-websocket-connection-endpoint.js";
import {
  CLIENT_CONNECTION_ENDPOINT_NIL_ID,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
} from "./index.js";
import { InMemoryConnectionEndpointServerRegistry } from "../../../transport/in-memory-connection-endpoint-server-registry.js";
import { IncomingConnectionGateway } from "../../incoming-connection-gateway.js";
import { createTestInMemoryIncomingConnectionGateways } from "./create-test-in-memory-incoming-connection-gateways.js";
import { createTestWebSocketIncomingConnectionGateways } from "./create-test-websocket-incoming-connection-gateways.js";
import { urlWithQueryParams } from "../../../utils/url-with-query-params.js";

export interface ClientEndpointFactory {
  createClientEndpoint(
    url: string,
    options?: {
      queryParams?: { name: string; value: string }[];
      headers?: Record<string, string>;
    }
  ): ConnectionEndpoint;
  createIncomingConnectionGateways(): {
    lobbyIncomingConnectionGateway: IncomingConnectionGateway;
    gameServerIncomingConnectionGateway: IncomingConnectionGateway;
  };
}

const websocketFactory: ClientEndpointFactory = {
  createClientEndpoint(
    url,
    options?: {
      queryParams?: { name: string; value: string }[];
      headers?: Record<string, string>;
    }
  ) {
    return new NodeWebSocketConnectionEndpoint(
      new WebSocket(urlWithQueryParams(url, options?.queryParams || []), options),
      CLIENT_CONNECTION_ENDPOINT_NIL_ID
    );
  },
  createIncomingConnectionGateways() {
    return createTestWebSocketIncomingConnectionGateways();
  },
};

export const inMemoryFactory: ClientEndpointFactory = {
  createClientEndpoint(
    url,
    options?: {
      queryParams?: { name: string; value: string }[];
      headers?: Record<string, string>;
    }
  ) {
    return InMemoryConnectionEndpointServerRegistry.singleton.connect(
      urlWithQueryParams(url, options?.queryParams || []),
      options
    );
  },
  createIncomingConnectionGateways() {
    return createTestInMemoryIncomingConnectionGateways();
  },
};

export interface TestAuthSessionIds {
  hostAuthSessionId: string;
  joinerAuthSessionId: string;
}

export const TEST_CONNECTION_ENDPOINT_FACTORIES = [
  {
    name: "node-websocket",
    clientEndpointFactory: websocketFactory,
  },
  {
    name: "in-memory",
    clientEndpointFactory: inMemoryFactory,
  },
  {
    name: "in-memory-auth-users",
    clientEndpointFactory: inMemoryFactory,
    authSessionIds: {
      hostAuthSessionId: TEST_AUTH_SESSION_ID_PLAYER_1,
      joinerAuthSessionId: TEST_AUTH_SESSION_ID_PLAYER_2,
    },
  },
];
