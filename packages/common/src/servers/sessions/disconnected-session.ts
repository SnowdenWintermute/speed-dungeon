import {
  ConnectionId,
  GameName,
  GameServerName,
  GuestSessionReconnectionToken,
  Username,
} from "../../aliases.js";
import { GameRegistry } from "../game-registry.js";
import { TaggedUserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class DisconnectedSession {
  constructor(
    private taggedUserId: TaggedUserId,
    private username: Username,
    private _gameName: GameName,
    public readonly gameServerName: GameServerName,
    public readonly guestUserReconnectionTokenOption: null | GuestSessionReconnectionToken
  ) {}

  static fromUserSession(session: UserSession, gameServerName: GameServerName) {
    return new DisconnectedSession(
      session.taggedUserId,
      session.username,
      session.currentGameName || ("" as GameName),
      gameServerName,
      session.getGuestReconnectionTokenOption()
    );
  }

  get gameName() {
    return this._gameName;
  }

  toUserSession(connectionId: ConnectionId, gameRegistry: GameRegistry) {
    return new UserSession(this.username, connectionId, this.taggedUserId, gameRegistry);
  }
}
