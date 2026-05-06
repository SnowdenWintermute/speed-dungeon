import { GameName, GameServerName, PartyName, Username } from "../../aliases.js";
import { GameServerSessionClaimToken } from "../lobby-server/game-handoff/session-claim-token.js";
import { TaggedUserId } from "./user-ids.js";

/** How we can track if a user is in a game on any of their connections as an
 * authenticated user, and check what phase of connection to a game they are in */
export class GlobalAuthGameSession {
  private _connectionStatus: TaggedGameSessionConnectionStatus;
  constructor(initialGameServerSessionClaimToken: GameServerSessionClaimToken) {
    this._connectionStatus = {
      type: GameSessionConnectionStatus.InitialConnectionPending,
      token: initialGameServerSessionClaimToken,
      gameName: initialGameServerSessionClaimToken.gameName,
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

export interface GameServerSessionData {
  gameName: GameName;
  partyName: PartyName;
  username: Username;
  taggedUserId: TaggedUserId;
  gameServerName: GameServerName;
}

export interface InitialConnectionPendingGameSessionStatus {
  type: GameSessionConnectionStatus.InitialConnectionPending;
  token: GameServerSessionClaimToken;
  gameName: GameName;
}

export interface ConnectedToGameServerGameSessionStatus {
  type: GameSessionConnectionStatus.ConnectedToGameServer;
  // used to derrive info for new token if another connection is taking over
  // this game server session
  sessionData: GameServerSessionData;
  gameName: GameName;
}

export interface AwaitingReconnectionGameSessionStatus {
  type: GameSessionConnectionStatus.AwaitingReconnection;
  gameName: GameName;
}

export type TaggedGameSessionConnectionStatus =
  | InitialConnectionPendingGameSessionStatus
  | ConnectedToGameServerGameSessionStatus
  | AwaitingReconnectionGameSessionStatus;
