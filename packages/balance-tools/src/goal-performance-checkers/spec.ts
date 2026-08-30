import type { AttributePointAssignableAttributes } from "@speed-dungeon/common";
import { GoalPerformanceCheckerType } from "./index.ts";
import type { SampledActionSelectionConfig } from "./sampled-action-selection.ts";
import type { EquipmentScoreDominationAxis } from "../solvers/equipment-score-domination-axis.ts";

export type GoalPerformanceCheckerTypeConfig =
  | { type: GoalPerformanceCheckerType.TotalAccuracy }
  | { type: GoalPerformanceCheckerType.WornArmorClass }
  | {
      type: GoalPerformanceCheckerType.SampledDamageOnTargetDummy;
      actionSelection: SampledActionSelectionConfig;
    };

export interface GoalPerformanceCheckerSpec {
  allocatableAttributes: AttributePointAssignableAttributes[];
  equipmentScoreAxes: EquipmentScoreDominationAxis[];
  /** when set, reaching the build's holdable specialty outranks any score difference and giving it
   * up is refused, so a build that must lose damage to hold its first shield still takes it */
  requiresHoldableSpecialty: boolean;
  typeConfig: GoalPerformanceCheckerTypeConfig;
}
