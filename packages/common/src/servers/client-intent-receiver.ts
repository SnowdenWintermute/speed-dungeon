import { ConnectionId } from "../aliases.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";

export interface RawConnectionEndpoint {
  readonly id: ConnectionId;
  sendRaw(payload: unknown): void;
  subscribeRaw(handler: (payload: unknown) => void): void;
  close(): void;
}

/** Listen for connections and parse their connection role and credentials. Transform the
 * real transport into an abstract ConnectionEndpoint */
export abstract class IncomingMessageGateway {
  abstract listen(): void;

  connectionHandler:
    | ((endpoint: RawConnectionEndpoint, identity: ConnectionIdentityResolutionContext) => void)
    | null = null;

  initialize(
    handler: (
      endpoint: RawConnectionEndpoint,
      identity: ConnectionIdentityResolutionContext
    ) => void
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
