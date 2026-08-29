import { GoalPerformanceChecker, GoalPerformanceCheckerType } from "./index.ts";
import { GoalPerformanceCheckerSpec } from "./spec.ts";
import { SampledDamageOnTargetDummyGoalPerformanceChecker } from "./sampled-damage-on-target-dummy.ts";
import { TotalAccuracyGoalPerformanceChecker } from "./total-accuracy.ts";
import { selectSampledActions } from "./sampled-action-selection.ts";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "../solvers/equipment-score-domination-axes.ts";
import { SeededRandomNumberGeneratorScopeProvider } from "../analysis-runs/seeded-random-number-generator-scope-provider.ts";
import { TargetDummyProvider } from "../analysis-runs/target-dummy-provider.ts";

export interface GoalPerformanceCheckerResources {
  scopeProvider: SeededRandomNumberGeneratorScopeProvider;
  targetDummyProvider: TargetDummyProvider;
}

export type GoalPerformanceCheckerConstructor = (
  spec: GoalPerformanceCheckerSpec,
  resources: GoalPerformanceCheckerResources
) => GoalPerformanceChecker;

// a switch rather than a Record keyed by type: each member carries its own configuration, and
// indexing a record with a union of keys gives back a union of functions no argument satisfies
export const constructGoalPerformanceChecker: GoalPerformanceCheckerConstructor = (
  spec,
  resources
) => {
  switch (spec.type) {
    case GoalPerformanceCheckerType.TotalAccuracy:
      return new TotalAccuracyGoalPerformanceChecker();
    case GoalPerformanceCheckerType.SampledDamageOnTargetDummy:
      return new SampledDamageOnTargetDummyGoalPerformanceChecker(
        selectSampledActions(spec.actionSelection),
        spec.allocatableAttributes,
        spec.equipmentScoreAxisNames.map(
          (axisName) => EQUIPMENT_SCORE_DOMINATION_AXES[axisName]
        ),
        resources.scopeProvider,
        resources.targetDummyProvider
      );
  }
};
