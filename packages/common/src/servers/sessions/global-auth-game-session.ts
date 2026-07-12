import { GameId, GameServerName, PartyName, Username } from "../../aliases.js";
import { GuestSessionReconnectionToken } from "../game-server/reconnection/guest-session-reconnection-token.js";
import { GameServerSessionClaimToken } from "../lobby-server/game-handoff/session-claim-token.js";
import { LobbyReconnectionProtocol } from "../lobby-server/reconnection/index.js";
import { Serializable, SerializedOf } from "../../serialization/index.js";
import { TaggedUserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class GlobalGameSession implements Serializable {
  constructor(
    private _gameSessionData: GameServerSessionData,
    private _connectionStatus: GameSessionConnectionStatus
  ) {}

  static fromUserSession(
    session: UserSession,
    gameServerName: GameServerName,
    connectionStatus: GameSessionConnectionStatus
  ) {
    return new GlobalGameSession(
      GameServerSessionData.fromUserSession(session, gameServerName),
      connectionStatus
    );
  }

  toSerialized() {
    return {
      gameSessionData: this._gameSessionData.toSerialized(),
      connectionStatus: this._connectionStatus,
    };
  }

  static fromSerialized(serialized: SerializedOf<GlobalGameSession>) {
    return new GlobalGameSession(
      GameServerSessionData.fromSerialized(serialized.gameSessionData),
      serialized.connectionStatus
    );
  }

  set connectionStatus(value: GameSessionConnectionStatus) {
    this._connectionStatus = value;
  }

  get connectionStatus() {
    return this._connectionStatus;
  }

  get gameId() {
    return this._gameSessionData.gameId;
  }

  set guestSessionReconnectionToken(value: GuestSessionReconnectionToken | null) {
    this._gameSessionData.guestUserReconnectionTokenOption = value;
  }

  createClaimToken(lobbyReconnectionProtocol: LobbyReconnectionProtocol) {
    return this._gameSessionData.toGameServerSessionClaimToken(lobbyReconnectionProtocol);
  }
}

export enum GameSessionConnectionStatus {
  InitialConnectionPending,
  ConnectedToGameServer,
  AwaitingReconnection,
}

export class GameServerSessionData implements Serializable {
  constructor(
    public readonly taggedUserId: TaggedUserId,
    private username: Username,
    private _gameId: GameId,
    private _partyName: PartyName,
    public readonly gameServerName: GameServerName,
    public guestUserReconnectionTokenOption: null | GuestSessionReconnectionToken
  ) {}

  toSerialized() {
    return {
      taggedUserId: this.taggedUserId,
      username: this.username,
      gameId: this._gameId,
      partyName: this._partyName,
      gameServerName: this.gameServerName,
      guestUserReconnectionTokenOption: this.guestUserReconnectionTokenOption
        ? this.guestUserReconnectionTokenOption.toSerialized()
        : null,
    };
  }

  static fromSerialized(serialized: SerializedOf<GameServerSessionData>) {
    return new GameServerSessionData(
      serialized.taggedUserId,
      serialized.username,
      serialized.gameId,
      serialized.partyName,
      serialized.gameServerName,
      serialized.guestUserReconnectionTokenOption
        ? GuestSessionReconnectionToken.fromSerialized(serialized.guestUserReconnectionTokenOption)
        : null
    );
  }

  static fromUserSession(session: UserSession, gameServerName: GameServerName) {
    if (session.currentGameId === null) {
      throw new Error("Can't create game session data for user not in game");
    }
    if (session.currentPartyName === null) {
      throw new Error("Can't create game session data for user not in party");
    }

    return new GameServerSessionData(
      session.taggedUserId,
      session.username,
      session.currentGameId,
      session.currentPartyName,
      gameServerName,
      session.getGuestReconnectionTokenOption()
    );
  }

  get gameId() {
    return this._gameId;
  }

  get partyName() {
    return this._partyName;
  }

  toGameServerSessionClaimToken(lobbyReconnectionProtocol: LobbyReconnectionProtocol) {
    return new GameServerSessionClaimToken(
      this._gameId,
      this._partyName,
      this.username,
      this.taggedUserId,
      lobbyReconnectionProtocol.getGameServerUrlFromName(this.gameServerName),
      this.guestUserReconnectionTokenOption || undefined
    );
  }
}
