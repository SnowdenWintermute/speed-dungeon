import { UntypedConnectionEndpoint } from "../transport/connection-endpoint.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";

/** Listen for connections and parse their connection role and credentials. Transform the
 * real transport into an abstract UntypedConnectionEndpoint. The owning server will determine
 * the connection role and transform the UntypedSocketConnectionEndpoint to a ConnectionEndpoint<Sendable, Receiveable> */
export abstract class IncomingConnectionGateway {
  abstract listen(): void;

  connectionHandler:
    | ((
        endpoint: UntypedConnectionEndpoint,
        identity: ConnectionIdentityResolutionContext
      ) => Promise<void>)
    | null = null;

  initialize(
    handler: (
      endpoint: UntypedConnectionEndpoint,
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
