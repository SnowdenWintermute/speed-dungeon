import { ConnectionId, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { UserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class DisconnectedSession {
  constructor(
    private userId: UserId,
    private username: Username
  ) {}

  toUserSession(connectionId: ConnectionId, getExpectedCurrentGame: () => SpeedDungeonGame) {
    return new UserSession(this.username, connectionId, this.userId, getExpectedCurrentGame);
  }
}
