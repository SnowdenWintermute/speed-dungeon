import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";

/** Listen for connections and parse their connection role and credentials */
export abstract class IncomingMessageGateway {
  /** Watch for and handle incoming connections. Set up their subscriptions. */
  abstract listen(): void;

  connectionHandler:
    | ((connectionIdentityContext: ConnectionIdentityResolutionContext) => void)
    | null = null;

  initialize(
    connectionHandler: (connectionIdentityContext: ConnectionIdentityResolutionContext) => void
  ) {
    this.connectionHandler = connectionHandler;
  }

  requireConnectionHandler() {
    if (this.connectionHandler === null) {
      throw new Error("Not initialized with a connectionHandler");
    }

    return this.connectionHandler;
  }
}
