import { makeAutoObservable } from "mobx";
import { BaseClient } from "./base";

export class ClientSingleton {
  private _client: null | BaseClient = null;

  constructor() {
    makeAutoObservable(this);
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
