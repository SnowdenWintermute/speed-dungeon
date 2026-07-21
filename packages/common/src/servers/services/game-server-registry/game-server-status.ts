import { GameServerName } from "../../../aliases.js";
import { GAME_SERVER_HEARTBEAT_MS } from "../../../app-consts.js";
import { Serializable, SerializedOf } from "../../../serialization/index.js";

/** identity and liveness only. how busy a server is gets derived from the active game
 * and pending setup records, which are the source of truth for what games exist */
export class GameServerStatus implements Serializable {
  private lastSeenAt: number = Date.now();
  constructor(
    public readonly name: GameServerName,
    public readonly url: string
  ) {}

  toSerialized() {
    return {
      name: this.name,
      url: this.url,
      lastSeenAt: this.lastSeenAt,
    };
  }

  static fromSerialized(serialized: SerializedOf<GameServerStatus>) {
    const status = new GameServerStatus(serialized.name, serialized.url);
    status.lastSeenAt = serialized.lastSeenAt;
    return status;
  }

  isStale() {
    const elapsed = Date.now() - this.lastSeenAt;
    const twoHeartbeatDurations = GAME_SERVER_HEARTBEAT_MS * 2;
    return elapsed > twoHeartbeatDurations;
  }

  refresh() {
    this.lastSeenAt = Date.now();
  }
}
