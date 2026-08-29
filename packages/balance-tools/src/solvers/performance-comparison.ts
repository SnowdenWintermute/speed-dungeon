import { GoalPerformance } from "../goal-performance-checkers/index.ts";

/**
 * One candidate loadout weighed against the one it would replace. Reaching the build the study
 * measures comes first, so a comparison worth taking can still have lost score: a shield build gives
 * up damage picking up its first shield, and on score alone would keep the two handed weapon it
 * started with and never become the build at all.
 */
export class PerformanceComparison {
  private constructor(
    readonly meetsBuildSpecificationFirstTime: boolean,
    readonly scoreDifference: number
  ) {}

  static between(before: GoalPerformance, after: GoalPerformance) {
    const wouldLeaveTheBuild = before.meetsBuildSpecification && !after.meetsBuildSpecification;
    if (wouldLeaveTheBuild) {
      return new PerformanceComparison(false, -1);
    }
    return new PerformanceComparison(
      !before.meetsBuildSpecification && after.meetsBuildSpecification,
      after.score - before.score
    );
  }

  isImprovement() {
    return this.meetsBuildSpecificationFirstTime || this.scoreDifference > 0;
  }

  beats(other: PerformanceComparison) {
    if (this.meetsBuildSpecificationFirstTime !== other.meetsBuildSpecificationFirstTime) {
      return this.meetsBuildSpecificationFirstTime;
    }
    return this.scoreDifference > other.scoreDifference;
  }
}
