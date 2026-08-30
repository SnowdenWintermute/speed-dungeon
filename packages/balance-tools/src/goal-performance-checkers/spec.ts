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
  /**
   * Whether holding the build's own equipment type is part of being the build at all. When it is,
   * reaching it outranks any score difference and giving it up is refused, so a build that must give
   * up damage to hold its first shield still picks the shield up. When it is not, what a character
   * ends up holding is only worth what it scores.
   */
  buildIsDefinedByHeldEquipment: boolean;
  typeConfig: GoalPerformanceCheckerTypeConfig;
}
