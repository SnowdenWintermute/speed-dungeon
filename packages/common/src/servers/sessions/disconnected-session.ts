import {
  ConnectionId,
  GameName,
  GameServerName,
  GuestSessionReconnectionToken,
  PartyName,
  Username,
} from "../../aliases.js";
import { GameRegistry } from "../game-registry.js";
import { TaggedUserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class DisconnectedSession {
  constructor(
    public readonly taggedUserId: TaggedUserId,
    private username: Username,
    private _gameName: GameName,
    private _partyName: PartyName,
    public readonly gameServerName: GameServerName,
    public readonly guestUserReconnectionTokenOption: null | GuestSessionReconnectionToken
  ) {}

  static fromUserSession(session: UserSession, gameServerName: GameServerName) {
    if (session.currentGameName === null) {
      throw new Error("Can't create disconnected session for user not in game");
    }
    if (session.currentPartyName === null) {
      throw new Error("Can't create disconnected session for user not in party");
    }
    return new DisconnectedSession(
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

  toUserSession(connectionId: ConnectionId, gameRegistry: GameRegistry) {
    return new UserSession(this.username, connectionId, this.taggedUserId, gameRegistry);
  }
}
