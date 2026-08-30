import { GoalPerformanceChecker, GoalPerformanceCheckerType } from "./index.ts";
import { GoalPerformanceCheckerSpec } from "./spec.ts";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "./sampled-damage-on-target-dummy.ts";
import { TotalAccuracyGoalPerformanceChecker } from "./total-accuracy.ts";
import { selectSampledActions } from "./sampled-action-selection.ts";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "../solvers/equipment-score-domination-axes.ts";
import { ComparisonRollScope } from "../analysis-runs/comparison-roll-scope.ts";
import { TargetDummyProvider } from "../analysis-runs/target-dummy-provider.ts";

export interface GoalPerformanceCheckerResources {
  comparisonRollScope: ComparisonRollScope;
  targetDummyProvider: TargetDummyProvider;
}

export type GoalPerformanceCheckerConstructor = (
  spec: GoalPerformanceCheckerSpec,
  resources: GoalPerformanceCheckerResources
) => GoalPerformanceChecker;

export const constructGoalPerformanceChecker: GoalPerformanceCheckerConstructor = (
  spec,
  resources
) => {
  const equipmentScoreAxes = spec.equipmentScoreAxes.map(
    (axis) => EQUIPMENT_SCORE_DOMINATION_AXES[axis]
  );

  switch (spec.typeConfig.type) {
    case GoalPerformanceCheckerType.TotalAccuracy:
      return new TotalAccuracyGoalPerformanceChecker(
        spec.allocatableAttributes,
        equipmentScoreAxes
      );
    case GoalPerformanceCheckerType.SampledDamageOnTargetDummy:
      return new SampledDamageOnTargetDummyGoalPerformanceChecker(
        selectSampledActions(spec.typeConfig.actionSelection),
        spec.allocatableAttributes,
        equipmentScoreAxes,
        resources.comparisonRollScope,
        resources.targetDummyProvider
      );
  }
};
