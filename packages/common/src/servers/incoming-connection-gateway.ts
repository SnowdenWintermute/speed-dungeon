import { IncomingMessage } from "node:http";
import { ConnectionId, GuestSessionReconnectionToken } from "../aliases.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";
import { v4 as uuidv4 } from "uuid";
import { InMemoryConnectionRequest } from "../transport/in-memory-connection-endpoint-server.js";
import { QUERY_PARAMS } from "./query-params.js";

/** Listen for connections and parse their credentials. Transform the real transport into an
 * abstract ConnectionEndpoint. The owning server will transform the ConnectionEndpoint
 * to a TypedConnectionEndpoint<Sendable, Receiveable> */
export abstract class IncomingConnectionGateway {
  abstract listen(): void;
  abstract close(): void;

  issueConnectionId() {
    return uuidv4() as ConnectionId;
  }

  connectionHandler:
    | ((
        endpoint: ConnectionEndpoint,
        identity: ConnectionIdentityResolutionContext
      ) => Promise<void>)
    | null = null;

  initialize(
    handler: (
      endpoint: ConnectionEndpoint,
      identity: ConnectionIdentityResolutionContext
    ) => Promise<void>
  ) {
    this.connectionHandler = handler;
  }

  requireConnectionHandler() {
    const connectionHandler = this.connectionHandler;
    if (connectionHandler === null) {
      throw new Error("Not initialized with a connectionHandler");
    }

    return connectionHandler;
  }

  protected parseConnectionIdentityContext(
    request: IncomingMessage | InMemoryConnectionRequest
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
}
