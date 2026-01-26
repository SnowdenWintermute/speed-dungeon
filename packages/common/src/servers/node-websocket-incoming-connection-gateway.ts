import { WebSocketServer } from "ws";
import { IncomingMessage } from "node:http";
import { IncomingConnectionGateway } from "./incoming-connection-gateway.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";
import { QUERY_PARAMS } from "./query-params.js";
import { GuestSessionReconnectionToken } from "../aliases.js";
import { NodeWebSocketConnectionEndpoint } from "../transport/node-websocket-connection-endpoint.js";

export class NodeWebSocketIncomingConnectionGateway extends IncomingConnectionGateway {
  constructor(private wss: WebSocketServer) {
    super();
  }

  close() {
    this.wss.close();
  }

  protected parseConnectionIdentityContext(
    request: IncomingMessage
  ): ConnectionIdentityResolutionContext {
    // @SECURITY - validate the query params
    if (request.url === undefined) {
      throw new Error("no url in handshake");
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const reconnectionToken = url.searchParams.get(QUERY_PARAMS.GUEST_RECONNECTION_TOKEN);
    const sessionClaimToken = url.searchParams.get(QUERY_PARAMS.SESSION_CLAIM_TOKEN);

    const cookies = Object.fromEntries(
      request.headers.cookie?.split("; ").map((c) => c.split("=")) ?? []
    );

    return {
      clientCachedGuestReconnectionToken:
        (reconnectionToken as GuestSessionReconnectionToken) || undefined,
      encodedGameServerSessionClaimToken: sessionClaimToken || undefined,
      cookies,
    };
  }

  listen() {
    this.wss.on("connection", async (socket, request) => {
      const identityContext = this.parseConnectionIdentityContext(request);

      const untypedEndpoint = new NodeWebSocketConnectionEndpoint(socket, this.issueConnectionId());
      await this.requireConnectionHandler()(untypedEndpoint, identityContext);
    });
  }
}
