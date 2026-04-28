import { IncomingMessage } from "node:http";
import { ConnectionId, GuestSessionReconnectionToken } from "../aliases.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";
import { v4 as uuidv4 } from "uuid";
import { InMemoryConnectionRequest } from "../transport/in-memory-connection-endpoint-server.js";
import { QUERY_PARAMS } from "./query-params.js";
import { invariant } from "../utils/index.js";

export type AuthSessionIdParser = (request: IncomingMessage | InMemoryConnectionRequest) => string;

/** Listen for connections and parse their credentials. Transform the real transport into an
 * abstract ConnectionEndpoint. The owning server will transform the ConnectionEndpoint
 * to a TypedConnectionEndpoint<Sendable, Receiveable> */
export abstract class IncomingConnectionGateway {
  abstract listen(): void;
  abstract close(): Promise<void>;

  issueConnectionId() {
    return uuidv4() as ConnectionId;
  }

  connectionHandler:
    | ((
        endpoint: ConnectionEndpoint,
        identity: ConnectionIdentityResolutionContext
      ) => Promise<void>)
    | null = null;

  authSessionIdParser: AuthSessionIdParser | null = null;

  initialize(
    connectionHandler: (
      endpoint: ConnectionEndpoint,
      identity: ConnectionIdentityResolutionContext
    ) => Promise<void>,
    authSessionIdParser: AuthSessionIdParser
  ) {
    this.connectionHandler = connectionHandler;
    this.authSessionIdParser = authSessionIdParser;
  }

  requireConnectionHandler() {
    const connectionHandler = this.connectionHandler;
    if (connectionHandler === null) {
      throw new Error("Not initialized with a connectionHandler");
    }

    return connectionHandler;
  }

  requireAuthSessionIdParser() {
    const authSessionIdParser = this.authSessionIdParser;
    if (authSessionIdParser === null) {
      throw new Error("Not initialized with an authSessionIdParser");
    }
    return authSessionIdParser;
  }

  protected parseConnectionIdentityContext(
    request: IncomingMessage | InMemoryConnectionRequest
  ): ConnectionIdentityResolutionContext {
    // @SECURITY - validate the query params
    invariant(request.url !== undefined, "no url in handshake");
    const url = new URL(request.url, `http://${request.headers.host}`);
    const reconnectionToken = url.searchParams.get(QUERY_PARAMS.GUEST_RECONNECTION_TOKEN);
    const sessionClaimToken = url.searchParams.get(QUERY_PARAMS.SESSION_CLAIM_TOKEN);

    const authSessionId = this.requireAuthSessionIdParser()(request);

    return {
      clientCachedGuestReconnectionToken:
        (reconnectionToken as GuestSessionReconnectionToken) || undefined,
      encodedGameServerSessionClaimToken: sessionClaimToken || undefined,
      authSessionId,
    };
  }
}

export function cookieHeaderAuthSessionIdParser(
  request: IncomingMessage | InMemoryConnectionRequest
) {
  const cookieHeaderOption = request.headers.cookie;
  if (cookieHeaderOption) {
    return Object.fromEntries(
      cookieHeaderOption.split("; ").map((cookie) => cookie.split("=")) ?? []
    )["id"];
  }

  return "";
}

export function queryParamsAuthSessionIdParser(
  request: IncomingMessage | InMemoryConnectionRequest
) {
  invariant(request.url !== undefined, "no url in handshake");
  if (request instanceof IncomingMessage && process.env.NODE_ENV === "production") {
    throw new Error("Don't use query params to parse id on a remote connection in production");
  }
  const url = new URL(request.url, `http://${request.headers.host}`);
  return url.searchParams.get(QUERY_PARAMS.UNTRUSTED_AUTH_SESSION_ID) || "";
}
