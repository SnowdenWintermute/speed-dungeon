import cloneDeep from "lodash.clonedeep";
import { Milliseconds } from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { SerializedOf } from "../../../serialization/index.js";
import { TaggedUserId } from "../../sessions/user-ids.js";
import { UserSession } from "../../sessions/user-session.js";

export class PendingGameSetup {
  // lobby should periodically check for stale game setups and delete them
  private createdAt: number = Date.now();
  private timeToLive: Milliseconds = ONE_SECOND * 60 * 5;
  private _taggedUserIds = new Set<TaggedUserId>();
  constructor(
    public readonly game: SerializedOf<SpeedDungeonGame>,
    userSessions: UserSession[]
  ) {
    for (const session of userSessions) {
      this._taggedUserIds.add(session.taggedUserId);
    }
  }

  isStale() {
    return Date.now() - this.createdAt > this.timeToLive;
  }

  get taggedUserIds() {
    return cloneDeep(this._taggedUserIds);
  }
}
