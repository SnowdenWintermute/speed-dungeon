import { LobbyClient } from "./lobby";

export class Clients {
  private _lobbyClient: LobbyClient | null = null;

  set lobby(newLobbyClient: LobbyClient) {
    this._lobbyClient = newLobbyClient;
  }

  requireLobby() {
    if (this._lobbyClient === null) {
      throw new Error("No lobby client configured");
    }
    return this._lobbyClient;
  }
}
