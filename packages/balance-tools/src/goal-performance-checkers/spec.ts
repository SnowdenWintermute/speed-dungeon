import type { AttributePointAssignableAttributes } from "@speed-dungeon/common";
import { GoalPerformanceCheckerType } from "./index.ts";
import type { SampledActionSelectionConfig } from "./sampled-action-selection.ts";
import type { EquipmentScoreDominationAxisName } from "../solvers/equipment-score-domination-axes.ts";

/**
 * How a named goal is measured. Data rather than behavior, so an axis is named rather than passed as
 * the function it resolves to.
 *
 * Which attributes and axes help is not derivable from the action sampled — a weapon swing scales on
 * strength and dexterity where a spell scales on spirit — so the goal states them.
 */
export type GoalPerformanceCheckerSpec =
  | { type: GoalPerformanceCheckerType.TotalAccuracy }
  | {
      type: GoalPerformanceCheckerType.SampledDamageOnTargetDummy;
      actionSelection: SampledActionSelectionConfig;
      allocatableAttributes: AttributePointAssignableAttributes[];
      equipmentScoreAxisNames: EquipmentScoreDominationAxisName[];
    };
