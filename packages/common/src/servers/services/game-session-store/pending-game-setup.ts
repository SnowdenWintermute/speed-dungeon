import { Milliseconds, Username } from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { UserId } from "../../sessions/user-ids.js";

export class PendingGameSetup {
  // lobby should periodically check for stale game setups and delete them
  private createdAt: number = Date.now();
  private timeToLive: Milliseconds = ONE_SECOND * 60 * 5;
  constructor(
    public readonly game: SpeedDungeonGame,
    // when users present their tokens, GameServer can create a session for them by UserId
    // without exposing UserId to the client in the token
    private userIdsByUsername: Map<Username, UserId>
  ) {}

  getUserIdByUsername(username: Username) {
    return this.userIdsByUsername.get(username);
  }
}
