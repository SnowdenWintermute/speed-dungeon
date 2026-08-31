import { CombatAttribute } from "@speed-dungeon/common";
import { GoalPerformanceChecker, GoalPerformanceCheckerType } from "./index.ts";
import { GoalPerformanceCheckerSpec } from "./spec.ts";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "./sampled-damage-on-target-dummy.ts";
import { TotalAttributeGoalPerformanceChecker } from "./total-attribute.ts";
import { WornArmorClassGoalPerformanceChecker } from "./worn-armor-class.ts";
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
    // one class, two checker types: AnalysisSubjects refuses a party whose goals score in different
    // units, and points of accuracy are not points of speed
    case GoalPerformanceCheckerType.TotalAccuracy:
      return new TotalAttributeGoalPerformanceChecker(
        CombatAttribute.Accuracy,
        spec.allocatableAttributes,
        equipmentScoreAxes
      );
    case GoalPerformanceCheckerType.TotalSpeed:
      return new TotalAttributeGoalPerformanceChecker(
        CombatAttribute.Speed,
        spec.allocatableAttributes,
        equipmentScoreAxes
      );
    case GoalPerformanceCheckerType.WornArmorClass:
      return new WornArmorClassGoalPerformanceChecker(
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
