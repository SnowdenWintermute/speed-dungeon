import { GameModeInGameDecisionsPolicy } from "../in-game-decisions-policy.js";

export class RaceModesInGameDecisionsPolicy extends GameModeInGameDecisionsPolicy {
  bossRoomRepeatsOnFloorRefill(): boolean {
    return false;
  }
}
