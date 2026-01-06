import { ConnectionId } from "../aliases.js";
import { UserIdentityResolutionContext } from "./services/identity-provider.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";

export interface IntentHandler<ClientMessage, ServerMessage> {
  handleIntent: (clientIntent: ClientMessage, fromConnectionId: ConnectionId) => void;
  handleConnection(
    connectionEndpoint: ConnectionEndpoint<ServerMessage, ClientMessage>,
    identityResolutionContext: UserIdentityResolutionContext
  ): Promise<void>;
}

/** Stands between the local/remote connection manager and packet receipt handlers */
export abstract class ClientIntentReceiver<ClientMessage, ServerMessage> {
  private intentHandler: IntentHandler<ClientMessage, ServerMessage> | null = null;

  /** Watch for and handle incoming connections. Set up their subscriptions. */
  abstract listen(): void;

  initialize(intentHandler: IntentHandler<ClientMessage, ServerMessage>) {
    this.intentHandler = intentHandler;
  }

  private requireInitialized() {
    if (this.intentHandler === null) {
      throw new Error("Not initialized");
    }
    return this.intentHandler;
  }

  async handleConnection(
    transportEndpoint: ConnectionEndpoint<ServerMessage, ClientMessage>,
    identityResolutionContext: UserIdentityResolutionContext
  ) {
    const intentHandler = this.requireInitialized();
    await intentHandler.handleConnection(transportEndpoint, identityResolutionContext);
  }

  dispatchIntent(clientIntent: ClientMessage, fromConnectionId: ConnectionId) {
    const intentHandler = this.requireInitialized();
    intentHandler.handleIntent(clientIntent, fromConnectionId);
  }
}
