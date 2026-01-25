import {
  ConnectionIdentityResolutionContext,
  IncomingConnectionGateway,
  NodeWebSocketConnectionEndpoint,
  GuestSessionReconnectionToken,
  QUERY_PARAMS,
} from "@speed-dungeon/common";
import { WebSocketServer } from "ws";
import { IncomingMessage } from "node:http";

export interface SocketHandshakeData {
  cookie?: string;
  [header: string]: string | string[] | undefined;
}

export class LobbyRemoteIncomingConnectionGateway extends IncomingConnectionGateway {
  constructor(private wss: WebSocketServer) {
    super();
  }

  protected parseConnectionIdentityContext(
    request: IncomingMessage
  ): ConnectionIdentityResolutionContext {
    if (request.url === undefined) {
      throw new Error("no url in handshake");
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const reconnectionToken = url.searchParams.get(QUERY_PARAMS.GUEST_RECONNECTION_TOKEN);
    const sessionClaimToken = url.searchParams.get(QUERY_PARAMS.SESSION_CLAIM_TOKEN);

    // @SECURITY - validate the query params

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
      if (request.url === undefined) {
        throw new Error("no url in handshake");
      }

      const identityContext = this.parseConnectionIdentityContext(request);

      const untypedEndpoint = new NodeWebSocketConnectionEndpoint(socket);
      await this.requireConnectionHandler()(untypedEndpoint, identityContext);
    });
  }
}
