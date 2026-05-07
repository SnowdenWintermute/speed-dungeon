import { GameName, GameServerName, PartyName, Username } from "../../aliases.js";
import { GuestSessionReconnectionToken } from "../game-server/reconnection/guest-session-reconnection-token.js";
import { GameServerSessionClaimToken } from "../lobby-server/game-handoff/session-claim-token.js";
import { LobbyReconnectionProtocol } from "../lobby-server/reconnection/index.js";
import { TaggedUserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class GlobalGameSession {
  private _gameSessionData: GameServerSessionData;
  constructor(
    session: UserSession,
    gameServerName: GameServerName,
    private _connectionStatus: GameSessionConnectionStatus
  ) {
    this._gameSessionData = GameServerSessionData.fromUserSession(session, gameServerName);
  }

  set connectionStatus(value: GameSessionConnectionStatus) {
    this._connectionStatus = value;
  }

  get connectionStatus() {
    return this._connectionStatus;
  }

  get gameName() {
    return this._gameSessionData.gameName;
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

export class GameServerSessionData {
  constructor(
    public readonly taggedUserId: TaggedUserId,
    private username: Username,
    private _gameName: GameName,
    private _partyName: PartyName,
    public readonly gameServerName: GameServerName,
    public guestUserReconnectionTokenOption: null | GuestSessionReconnectionToken
  ) {}

  static fromUserSession(session: UserSession, gameServerName: GameServerName) {
    if (session.currentGameName === null) {
      throw new Error("Can't create game session data for user not in game");
    }
    if (session.currentPartyName === null) {
      throw new Error("Can't create game session data for user not in party");
    }

    return new GameServerSessionData(
      session.taggedUserId,
      session.username,
      session.currentGameName,
      session.currentPartyName,
      gameServerName,
      session.getGuestReconnectionTokenOption()
    );
  }

  get gameName() {
    return this._gameName;
  }

  get partyName() {
    return this._partyName;
  }

  toGameServerSessionClaimToken(lobbyReconnectionProtocol: LobbyReconnectionProtocol) {
    return new GameServerSessionClaimToken(
      this._gameName,
      this._partyName,
      this.username,
      this.taggedUserId,
      lobbyReconnectionProtocol.getGameServerUrlFromName(this.gameServerName),
      this.guestUserReconnectionTokenOption || undefined
    );
  }
}
