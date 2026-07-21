import { GameId, GameName, GameServerName } from "../../../aliases.js";
import { GAME_RECORD_HEARTBEAT_MS } from "../../../app-consts.js";
import { Serializable, SerializedOf } from "../../../serialization/index.js";

export class ActiveGameStatus implements Serializable {
  private createdAt: number = Date.now();
  constructor(
    public readonly name: GameName,
    public readonly id: GameId,
    public readonly hostingServerName: GameServerName
  ) {}

  toSerialized() {
    return {
      name: this.name,
      id: this.id,
      hostingServerName: this.hostingServerName,
      createdAt: this.createdAt,
    };
  }

  static fromSerialized(serialized: SerializedOf<ActiveGameStatus>) {
    const status = new ActiveGameStatus(
      serialized.name,
      serialized.id,
      serialized.hostingServerName
    );
    status.createdAt = serialized.createdAt;
    return status;
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
