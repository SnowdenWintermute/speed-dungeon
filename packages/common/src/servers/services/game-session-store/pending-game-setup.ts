import { Milliseconds } from "../../../aliases.js";
import { ONE_SECOND } from "../../../app-consts.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { SerializedOf } from "../../../serialization/index.js";

export class PendingGameSetup {
  // lobby should periodically check for stale game setups and delete them
  private createdAt: number = Date.now();
  private timeToLive: Milliseconds = ONE_SECOND * 60 * 5;
  constructor(public readonly game: SerializedOf<SpeedDungeonGame>) {}

  isStale() {
    return Date.now() - this.createdAt > this.timeToLive;
  }
}
