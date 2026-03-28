import {
  CLIENT_CONNECTION_ENDPOINT_NIL_ID,
  ConnectionEndpoint,
  IncomingConnectionGateway,
  InMemoryConnectionEndpointServerRegistry,
  urlWithQueryParams,
} from "@speed-dungeon/common";
import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "./index.js";
import { createTestWebSocketIncomingConnectionGateways } from "./create-test-websocket-incoming-connection-gateways.js";
import { createTestInMemoryIncomingConnectionGateways } from "./create-test-in-memory-incoming-connection-gateways.js";
import { NodeWebSocketConnectionEndpoint } from "@speed-dungeon/server";
import { WebSocket } from "ws";

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
