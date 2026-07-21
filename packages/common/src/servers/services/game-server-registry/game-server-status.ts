import { GameServerName } from "../../../aliases.js";
import { GAME_SERVER_HEARTBEAT_MS } from "../../../app-consts.js";
import { Serializable, SerializedOf } from "../../../serialization/index.js";

export class GameServerStatus implements Serializable {
  private lastSeenAt: number = Date.now();
  constructor(
    public readonly name: GameServerName,
    public readonly url: string,
    public activeGameCount: number
  ) {}

  toSerialized() {
    return {
      name: this.name,
      url: this.url,
      activeGameCount: this.activeGameCount,
      lastSeenAt: this.lastSeenAt,
    };
  }

  static fromSerialized(serialized: SerializedOf<GameServerStatus>) {
    const status = new GameServerStatus(
      serialized.name,
      serialized.url,
      serialized.activeGameCount
    );
    status.lastSeenAt = serialized.lastSeenAt;
    return status;
  }

  isStale() {
    const elapsed = Date.now() - this.lastSeenAt;
    const twoHeartbeatDurations = GAME_SERVER_HEARTBEAT_MS * 2;
    return elapsed > twoHeartbeatDurations;
  }

  refresh(activeGameCount: number) {
    this.activeGameCount = activeGameCount;
    this.lastSeenAt = Date.now();
  }
}
