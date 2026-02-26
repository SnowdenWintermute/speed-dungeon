import { LobbyClient } from "@/clients/lobby";
import { makeAutoObservable } from "mobx";

class LobbyClientSingleton {
  private _lobbyClient: null | LobbyClient = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get() {
    if (this._lobbyClient === null) {
      throw new Error("Lobby client not yet initialized");
    }
    return this._lobbyClient;
  }

  setClient(client: LobbyClient) {
    this._lobbyClient = client;
  }

  get isInitialized() {
    return this._lobbyClient !== null;
  }
}

export const lobbyClientSingleton = new LobbyClientSingleton();
