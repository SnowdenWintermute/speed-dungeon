import { CombatActionName, CombatAttribute } from "@speed-dungeon/common";
import type { ActionRank } from "@speed-dungeon/common";
import { GoalPerformanceCheckerType } from "./index.ts";
import type { GoalPerformanceCheckerSpec } from "./spec.ts";
import { SampledActionSelectionType } from "./sampled-action-selection.ts";
import { EquipmentScoreDominationAxis } from "../solvers/equipment-score-domination-axis.ts";

export enum AnalysisGoal {
  TotalAccuracy,
  WeaponAttackDamage,
  IceBoltDamage,
}

export const ANALYSIS_GOAL_STRINGS: Record<AnalysisGoal, string> = {
  [AnalysisGoal.TotalAccuracy]: "total accuracy",
  [AnalysisGoal.WeaponAttackDamage]: "weapon attack damage",
  [AnalysisGoal.IceBoltDamage]: "ice bolt damage",
};

const ICE_BOLT_RANK = 1 as ActionRank;

export const ANALYSIS_GOAL_SPECS: Record<AnalysisGoal, GoalPerformanceCheckerSpec> = {
  [AnalysisGoal.TotalAccuracy]: {
    typeConfig: { type: GoalPerformanceCheckerType.TotalAccuracy },
    allocatableAttributes: [CombatAttribute.Dexterity],
    equipmentScoreAxes: [
      EquipmentScoreDominationAxis.Dexterity,
      EquipmentScoreDominationAxis.Accuracy,
    ],
  },

  [AnalysisGoal.WeaponAttackDamage]: {
    typeConfig: {
      type: GoalPerformanceCheckerType.SampledDamageOnTargetDummy,
      actionSelection: { type: SampledActionSelectionType.WeaponAttacks },
    },
    allocatableAttributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    equipmentScoreAxes: [
      EquipmentScoreDominationAxis.Strength,
      EquipmentScoreDominationAxis.Dexterity,
      EquipmentScoreDominationAxis.Accuracy,
      EquipmentScoreDominationAxis.NonWeaponFlatDamage,
      EquipmentScoreDominationAxis.WeaponDamageAverage,
    ],
  },

  /**
   * The parent overrides the projectile's hit outcome template with
   * the spell's damage calculation, while the projectile's own getter reads properties stashed on a
   * spawned action entity and throws for any other user.
   */
  [AnalysisGoal.IceBoltDamage]: {
    typeConfig: {
      type: GoalPerformanceCheckerType.SampledDamageOnTargetDummy,
      actionSelection: {
        type: SampledActionSelectionType.NamedActions,
        actionNames: [CombatActionName.IceBoltParent],
        rank: ICE_BOLT_RANK,
      },
    },

    allocatableAttributes: [CombatAttribute.Spirit, CombatAttribute.Dexterity],
    equipmentScoreAxes: [
      EquipmentScoreDominationAxis.Spirit,
      EquipmentScoreDominationAxis.Accuracy,
      EquipmentScoreDominationAxis.Dexterity,
    ],
  },
};
