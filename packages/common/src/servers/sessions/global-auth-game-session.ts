/** How we can track if a user is in a game on any of their connections as an
 * authenticated user, and check what phase of connection to a game they are in */
export class GlobalAuthGameSession {
  _connectionStatus: GameSessionConnectionStatus =
    GameSessionConnectionStatus.InitialConnectionPending;

  set connectionStatus(value: GameSessionConnectionStatus) {
    this._connectionStatus = value;
  }

  get connectionStatus() {
    return this._connectionStatus;
  }
}

export enum GameSessionConnectionStatus {
  InitialConnectionPending,
  ConnectedToGameServer,
  AwaitingReconnection,
}
