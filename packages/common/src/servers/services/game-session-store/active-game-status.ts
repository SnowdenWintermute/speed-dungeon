import { GameName } from "../../../aliases.js";
import { GAME_RECORD_HEARTBEAT_MS } from "../../../app-consts.js";

export class ActiveGameStatus {
  private createdAt: number = Date.now();
  constructor(
    public readonly name: GameName,
    public readonly id: string
  ) {}

  isStale() {
    const elapsed = Date.now() - this.createdAt;
    const twoHeartbeatDurations = GAME_RECORD_HEARTBEAT_MS * 2;
    return elapsed > twoHeartbeatDurations;
  }

  refresh() {
    this.createdAt = Date.now();
  }
}
