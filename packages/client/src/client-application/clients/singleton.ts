import { makeAutoObservable } from "mobx";
import { BaseClient } from "./base";

export class ClientSingleton<T extends BaseClient> {
  private _client: null | T = null;

  constructor() {
    makeAutoObservable(this);
  }

  get() {
    if (this._client === null) {
      throw new Error("client not yet initialized");
    }
    return this._client;
  }

  setClient(client: T) {
    this._client = client;
  }

  get isInitialized() {
    return this._client !== null;
  }
}
