import cloneDeep from "lodash.clonedeep";
import { GameName } from "../../../aliases.js";
import { GAME_RECORD_HEARTBEAT_MS } from "../../../app-consts.js";
import { TaggedUserId } from "../../sessions/user-ids.js";

export class ActiveGameStatus {
  private createdAt: number = Date.now();
  private _taggedUserIds: Set<TaggedUserId>;
  constructor(
    public readonly name: GameName,
    public readonly id: string,
    taggedUserIds: Set<TaggedUserId>
  ) {
    this._taggedUserIds = taggedUserIds;
  }

  get taggedUserIds() {
    return cloneDeep(this._taggedUserIds);
  }

  removeTaggedUserId(taggedId: TaggedUserId) {
    for (const stored of this._taggedUserIds) {
      if (stored.type === taggedId.type && stored.id === taggedId.id) {
        this._taggedUserIds.delete(stored);
        return;
      }
    }
  }

  isStale() {
    const elapsed = Date.now() - this.createdAt;
    const twoHeartbeatDurations = GAME_RECORD_HEARTBEAT_MS * 2;
    return elapsed > twoHeartbeatDurations;
  }

  refresh() {
    this.createdAt = Date.now();
  }
}
