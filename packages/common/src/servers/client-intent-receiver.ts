import { ConnectionId } from "../aliases.js";
import { IdentityResolutionContext } from "./services/identity-provider.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";

export interface IntentHandler<
  ClientMessage extends { type: PropertyKey; data: unknown },
  ServerMessage extends { type: PropertyKey; data: unknown },
> {
  handleIntent: (clientIntent: ClientMessage, fromConnectionId: ConnectionId) => void;
  handleConnection(
    transportEndpoint: ConnectionEndpoint<ServerMessage, ClientMessage>,
    identityResolutionContext: IdentityResolutionContext
  ): Promise<void>;
}

export abstract class ClientIntentReceiver<
  ClientMessage extends { type: PropertyKey; data: unknown },
  ServerMessage extends { type: PropertyKey; data: unknown },
> {
  private intentHandler: IntentHandler<ClientMessage, ServerMessage> | null = null;

  initialize(intentHandler: IntentHandler<ClientMessage, ServerMessage>) {
    this.intentHandler = intentHandler;
  }

  async handleConnection(
    transportEndpoint: ConnectionEndpoint<ServerMessage, ClientMessage>,
    identityResolutionContext: IdentityResolutionContext
  ) {
    if (this.intentHandler === null) {
      throw new Error("Not initialized");
    }
    await this.intentHandler.handleConnection(transportEndpoint, identityResolutionContext);
  }

  /** either set up the socket.io event listener for ClientIntent
      or some way the client app can "listen" to local events
      and determine which player they came from */
  abstract listen(): void;

  dispatchIntent(clientIntent: ClientMessage, fromConnectionId: ConnectionId) {
    const expectedHandler = this.intentHandler;

    if (expectedHandler === null) {
      throw new Error("Lobby was not initialized");
    }

    expectedHandler.handleIntent(clientIntent, fromConnectionId);
  }
}
