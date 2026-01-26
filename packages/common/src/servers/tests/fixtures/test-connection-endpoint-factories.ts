import { ConnectionEndpoint } from "../../../transport/connection-endpoint.js";
import WebSocket from "ws";
import { NodeWebSocketConnectionEndpoint } from "../../../transport/node-websocket-connection-endpoint.js";
import { CLIENT_CONNECTION_ENDPOINT_NIL_ID } from "./index.js";
import { InMemoryConnectionEndpointServerRegistry } from "../../../transport/in-memory-connection-endpoint-server-registry.js";
import { IncomingConnectionGateway } from "../../incoming-connection-gateway.js";
import { createTestInMemoryIncomingConnectionGateways } from "./create-test-in-memory-incoming-connection-gateways.js";
import { createTestWebSocketIncomingConnectionGateways } from "./create-test-websocket-incoming-connection-gateways.js";

export interface ClientEndpointFactory {
  name: string;
  createClientEndpoint(
    url: string,
    options?: {
      headers?: Record<string, string>;
    }
  ): ConnectionEndpoint;
  createIncomingConnectionGateways(): {
    lobbyIncomingConnectionGateway: IncomingConnectionGateway;
    gameServerIncomingConnectionGateway: IncomingConnectionGateway;
  };
}

const websocketFactory: ClientEndpointFactory = {
  name: "node-websocket",
  createClientEndpoint(
    url,
    options?: {
      headers?: Record<string, string>;
    }
  ) {
    return new NodeWebSocketConnectionEndpoint(
      new WebSocket(url, options),
      CLIENT_CONNECTION_ENDPOINT_NIL_ID
    );
  },
  createIncomingConnectionGateways() {
    return createTestWebSocketIncomingConnectionGateways();
  },
};

export const inMemoryFactory: ClientEndpointFactory = {
  name: "in-memory",
  createClientEndpoint(
    url,
    options?: {
      headers?: Record<string, string>;
    }
  ) {
    return InMemoryConnectionEndpointServerRegistry.singleton.connect(url, options);
  },
  createIncomingConnectionGateways() {
    return createTestInMemoryIncomingConnectionGateways();
  },
};

export const TEST_CONNECTION_ENDPOINT_FACTORIES = [websocketFactory, inMemoryFactory];
