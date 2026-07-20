import { GameModeInGameDecisionsPolicy } from "../in-game-decisions-policy.js";

export class ProgressionModeInGameDecisionsPolicy extends GameModeInGameDecisionsPolicy {
  bossRoomRepeatsOnFloorRefill(): boolean {
    return true;
  }
}
