import { GoalPerformanceChecker, GoalPerformanceCheckerType } from ".";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "../studies/attack-damage/goal-performance-checker";
import { TotalAccuracyGoalPerformanceChecker } from "../studies/max-accuracy/goal-performance-checker";

export const GOAL_PERFORMANCE_CONSTRUCTORS: Record<
  GoalPerformanceCheckerType,
  new () => GoalPerformanceChecker
> = {
  [GoalPerformanceCheckerType.TotalAccuracy]: TotalAccuracyGoalPerformanceChecker,
  [GoalPerformanceCheckerType.SampledAttackDamageOnTargetDummy]:
    SampledDamageOnTargetDummyGoalPerformanceChecker,
};
