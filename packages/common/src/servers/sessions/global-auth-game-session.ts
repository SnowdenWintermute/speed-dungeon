import { GameServerSessionClaimToken } from "../lobby-server/game-handoff/session-claim-token.js";

/** How we can track if a user is in a game on any of their connections as an
 * authenticated user, and check what phase of connection to a game they are in */
export class GlobalAuthGameSession {
  private _connectionStatus: TaggedGameSessionConnectionStatus;
  constructor(initialGameServerSessionClaimToken: GameServerSessionClaimToken) {
    this._connectionStatus = {
      type: GameSessionConnectionStatus.InitialConnectionPending,
      token: initialGameServerSessionClaimToken,
    };
  }
  set connectionStatus(value: TaggedGameSessionConnectionStatus) {
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

export interface InitialConnectionPendingGameSessionStatus {
  type: GameSessionConnectionStatus.InitialConnectionPending;
  token: GameServerSessionClaimToken;
}

export interface ConnectedToGameServerGameSessionStatus {
  type: GameSessionConnectionStatus.ConnectedToGameServer;
}

export interface AwaitingReconnectionGameSessionStatus {
  type: GameSessionConnectionStatus.AwaitingReconnection;
}

export type TaggedGameSessionConnectionStatus =
  | InitialConnectionPendingGameSessionStatus
  | ConnectedToGameServerGameSessionStatus
  | AwaitingReconnectionGameSessionStatus;
