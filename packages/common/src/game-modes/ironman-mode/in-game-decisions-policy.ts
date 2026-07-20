import { GameModeInGameDecisionsPolicy } from "../in-game-decisions-policy.js";

export class IronmanModeInGameDecisionsPolicy extends GameModeInGameDecisionsPolicy {
  bossRoomRepeatsOnFloorRefill(): boolean {
    return false;
  }
}
