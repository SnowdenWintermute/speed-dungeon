import { GameServerName, Milliseconds } from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { Serializable, SerializedOf } from "../../../serialization/index.js";

export class PendingGameSetup implements Serializable {
  // lobby should periodically check for stale game setups and delete them
  private createdAt: number = Date.now();
  private timeToLive: Milliseconds = ONE_SECOND * 60 * 5;
  constructor(
    public readonly game: SerializedOf<SpeedDungeonGame>,
    public readonly hostingServerName: GameServerName
  ) {}

  toSerialized() {
    return {
      game: this.game,
      hostingServerName: this.hostingServerName,
      createdAt: this.createdAt,
      timeToLive: this.timeToLive,
    };
  }

  static fromSerialized(serialized: SerializedOf<PendingGameSetup>) {
    const setup = new PendingGameSetup(serialized.game, serialized.hostingServerName);
    setup.createdAt = serialized.createdAt;
    setup.timeToLive = serialized.timeToLive;
    return setup;
  }

  isStale() {
    return Date.now() - this.createdAt > this.timeToLive;
  }
}
