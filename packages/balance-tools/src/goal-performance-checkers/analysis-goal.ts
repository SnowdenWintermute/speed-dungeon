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
  ArmorClass,
}

export const ANALYSIS_GOAL_STRINGS: Record<AnalysisGoal, string> = {
  [AnalysisGoal.TotalAccuracy]: "total accuracy",
  [AnalysisGoal.WeaponAttackDamage]: "weapon attack damage",
  [AnalysisGoal.IceBoltDamage]: "ice bolt damage",
  [AnalysisGoal.ArmorClass]: "armor class",
};

const ICE_BOLT_RANK = 1 as ActionRank;

export const ANALYSIS_GOAL_SPECS: Record<AnalysisGoal, GoalPerformanceCheckerSpec> = {
  [AnalysisGoal.TotalAccuracy]: {
    typeConfig: { type: GoalPerformanceCheckerType.TotalAccuracy },
    allocatableAttributes: [CombatAttribute.Dexterity],
    // every build starts holding something other than its specialty, so requiring it here would zero
    // out inherent, allocated and ring accuracy in exactly the rooms no specialty weapon dropped in
    requiresHoldableSpecialty: false,
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
    requiresHoldableSpecialty: true,
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
    requiresHoldableSpecialty: true,
    equipmentScoreAxes: [
      EquipmentScoreDominationAxis.Spirit,
      EquipmentScoreDominationAxis.Accuracy,
      EquipmentScoreDominationAxis.Dexterity,
    ],
  },

  /**
   * Nothing is allocated: armor class comes off equipment alone, and this goal's attributes are
   * copied from another study rather than earned. No specialty is required either — a shield is pure
   * gain and needs no ratchet to be picked up, and the other builds end a run empty handed.
   */
  [AnalysisGoal.ArmorClass]: {
    typeConfig: { type: GoalPerformanceCheckerType.WornArmorClass },
    allocatableAttributes: [],
    requiresHoldableSpecialty: false,
    equipmentScoreAxes: [EquipmentScoreDominationAxis.ArmorClass],
  },
};
