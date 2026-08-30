import type { AttributePointAssignableAttributes } from "@speed-dungeon/common";
import { GoalPerformanceCheckerType } from "./index.ts";
import type { SampledActionSelectionConfig } from "./sampled-action-selection.ts";
import type { EquipmentScoreDominationAxis } from "../solvers/equipment-score-domination-axis.ts";

export type GoalPerformanceCheckerTypeConfig =
  | { type: GoalPerformanceCheckerType.TotalAccuracy }
  | {
      type: GoalPerformanceCheckerType.SampledDamageOnTargetDummy;
      actionSelection: SampledActionSelectionConfig;
    };

export interface GoalPerformanceCheckerSpec {
  allocatableAttributes: AttributePointAssignableAttributes[];
  equipmentScoreAxes: EquipmentScoreDominationAxis[];
  typeConfig: GoalPerformanceCheckerTypeConfig;
}
