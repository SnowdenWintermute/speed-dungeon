import { GoalPerformance } from "../goal-performance-checkers/index.ts";

/**
 * One candidate loadout weighed against the one it would replace. Reaching the build the study
 * measures comes first, so a comparison worth taking can still have lost score: a shield build gives
 * up damage picking up its first shield, and on score alone would keep the two handed weapon it
 * started with and never become the build at all.
 */
export class PerformanceComparison {
  private constructor(
    readonly reachesBuildDefiningEquipment: boolean,
    readonly scoreDifference: number
  ) {}

  static between(before: GoalPerformance, after: GoalPerformance) {
    const wouldLeaveTheBuild =
      before.holdsBuildDefiningEquipment && !after.holdsBuildDefiningEquipment;
    if (wouldLeaveTheBuild) {
      return new PerformanceComparison(false, -1);
    }
    return new PerformanceComparison(
      !before.holdsBuildDefiningEquipment && after.holdsBuildDefiningEquipment,
      after.score - before.score
    );
  }

  isImprovement() {
    return this.reachesBuildDefiningEquipment || this.scoreDifference > 0;
  }

  beats(other: PerformanceComparison) {
    if (this.reachesBuildDefiningEquipment !== other.reachesBuildDefiningEquipment) {
      return this.reachesBuildDefiningEquipment;
    }
    return this.scoreDifference > other.scoreDifference;
  }
}
