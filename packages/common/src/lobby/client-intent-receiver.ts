import { ClientIntent } from "../packets/client-intents.js";
import { ConnectionId } from "../types.js";

export interface IntentHandler {
  handleIntent: (clientIntent: ClientIntent, fromConnectionId: ConnectionId) => void;
}

export abstract class ClientIntentReceiver {
  private intentHandler: IntentHandler | null = null;

  initialize(intentHandler: IntentHandler) {
    this.intentHandler = intentHandler;
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
