import { makeAutoObservable } from "mobx";

export enum ConnectionStatus {
  Initializing,
  Connected,
  Disconnected,
}
export class ConnectionStatusStore {
  private _connectionStatus: ConnectionStatus = ConnectionStatus.Initializing;

  constructor() {
    makeAutoObservable(this);
  }

  set connectionStatus(newStatus: ConnectionStatus) {
    this._connectionStatus = newStatus;
  }

  get connectionStatus() {
    return this._connectionStatus;
  }

  get isConnected() {
    return this.connectionStatus === ConnectionStatus.Connected;
  }
}
