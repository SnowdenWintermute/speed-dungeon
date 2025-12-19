import { ClientIntent } from "../packets/client-intents.js";
import { Lobby } from "./index.js";
import { LobbyUser } from "./lobby-user.js";

export abstract class LobbyClientIntentReceiver {
  private lobby: Lobby | null = null;
  constructor() {}

  initialize(lobby: Lobby) {
    this.lobby = lobby;
  }

  // either set up the socket.io event listener for ClientIntent
  // or some way the client app can "listen" to local events
  // and determine which player they came from
  abstract listen(): void;

  forwardIntent(clientIntent: ClientIntent, fromUser: LobbyUser) {
    const expectedLobby = this.lobby;

    if (expectedLobby === null) {
      throw new Error("Lobby was not initialized");
    }

    expectedLobby.handleIntent(clientIntent, fromUser);
  }
}
