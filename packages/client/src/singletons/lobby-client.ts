import { BaseClient } from "@/clients/base-client";
import { makeAutoObservable } from "mobx";

export class ClientSingleton {
  private _client: null | BaseClient = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get() {
    if (this._client === null) {
      throw new Error("client not yet initialized");
    }
    return this._client;
  }

  setClient(client: BaseClient) {
    this._client = client;
  }

  get isInitialized() {
    return this._client !== null;
  }
}

export const lobbyClientSingleton = new ClientSingleton();
export const gameClientSingleton = new ClientSingleton();
