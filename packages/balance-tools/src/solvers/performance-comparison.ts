import { GoalPerformance } from "../goal-performance-checkers/index.ts";

/**
 * One candidate loadout weighed against the one it would replace. Reaching the holdable specialty
 * comes first, so a comparison worth taking can still have lost score: a shield build gives up
 * damage picking up its first shield, and on score alone would keep the two handed weapon it started
 * with and never become the build at all.
 */
export class PerformanceComparison {
  private constructor(
    readonly reachesHoldableSpecialty: boolean,
    readonly scoreDifference: number
  ) {}

  static between(before: GoalPerformance, after: GoalPerformance) {
    const wouldLeaveTheSpecialty =
      before.isWearingHoldableSpecialty && !after.isWearingHoldableSpecialty;
    if (wouldLeaveTheSpecialty) {
      return new PerformanceComparison(false, -1);
    }
    return new PerformanceComparison(
      !before.isWearingHoldableSpecialty && after.isWearingHoldableSpecialty,
      after.score - before.score
    );
  }

  isImprovement() {
    return this.reachesHoldableSpecialty || this.scoreDifference > 0;
  }

  beats(other: PerformanceComparison) {
    if (this.reachesHoldableSpecialty !== other.reachesHoldableSpecialty) {
      return this.reachesHoldableSpecialty;
    }
    return this.scoreDifference > other.scoreDifference;
  }
}
