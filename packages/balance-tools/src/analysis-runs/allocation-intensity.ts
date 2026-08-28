import { NormalizedPercentage } from "@speed-dungeon/common";

/** everything a party earns goes toward the goal, which is the ceiling a study measures against */
export const FULL_ALLOCATION_INTENSITY: NormalizedPercentage = 1;

/** how much of what a party earns — the points a level up grants, the value on the equipment they
 * find — goes toward the goal a study measures. the game is designed around a build that spreads
 * its allocation between offense and defense, so a study run at the intended intensity describes
 * the average party, while a full intensity describes the glass cannon that could be built instead */
export class AllocationIntensity {
  constructor(private intensity: NormalizedPercentage) {}

  scaleValue(value: number) {
    return value * this.intensity;
  }

  pointsTowardGoal(grantedPoints: number) {
    return Math.floor(grantedPoints * this.intensity);
  }
}
