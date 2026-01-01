import { ClientIntent } from "../packets/client-intents.js";
import { ConnectionId } from "../aliases.js";
import { IdentityResolutionContext } from "./services/identity-provider.js";
import { TransportEndpoint } from "./update-delivery/transport-endpoint.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";

export interface IntentHandler {
  handleIntent: (clientIntent: ClientIntent, fromConnectionId: ConnectionId) => void;
  handleConnection(
    transportEndpoint: TransportEndpoint<GameStateUpdate, ClientIntent>,
    identityResolutionContext: IdentityResolutionContext
  ): Promise<void>;
}

export abstract class ClientIntentReceiver {
  private intentHandler: IntentHandler | null = null;

  initialize(intentHandler: IntentHandler) {
    this.intentHandler = intentHandler;
  }

  async handleConnection(
    transportEndpoint: TransportEndpoint<GameStateUpdate, ClientIntent>,
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

  dispatchIntent(clientIntent: ClientIntent, fromConnectionId: ConnectionId) {
    const expectedHandler = this.intentHandler;

    if (expectedHandler === null) {
      throw new Error("Lobby was not initialized");
    }

    expectedHandler.handleIntent(clientIntent, fromConnectionId);
  }
}
