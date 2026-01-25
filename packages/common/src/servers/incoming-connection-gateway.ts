import { ConnectionId } from "../aliases.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";
import { v4 as uuidv4 } from "uuid";

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
}
