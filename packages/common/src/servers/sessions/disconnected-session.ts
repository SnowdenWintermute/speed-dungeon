import { ConnectionId, Username } from "../../aliases.js";
import { GameRegistry } from "../game-registry.js";
import { TaggedUserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class DisconnectedSession {
  constructor(
    private taggedUserId: TaggedUserId,
    private username: Username
  ) {}

  static fromUserSession(session: UserSession) {
    return new DisconnectedSession(session.taggedUserId, session.username);
  }

  toUserSession(connectionId: ConnectionId, gameRegistry: GameRegistry) {
    return new UserSession(this.username, connectionId, this.taggedUserId, gameRegistry);
  }
}
