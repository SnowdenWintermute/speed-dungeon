import { ConnectionId, Username } from "../../aliases.js";
import { GameRegistry } from "../game-registry.js";
import { UserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class DisconnectedSession {
  constructor(
    private userId: UserId,
    private username: Username
  ) {}

  toUserSession(connectionId: ConnectionId, gameRegistry: GameRegistry) {
    return new UserSession(this.username, connectionId, this.userId, gameRegistry);
  }
}
