import { CombatActionName, CombatAttribute } from "@speed-dungeon/common";
import type { ActionRank } from "@speed-dungeon/common";
import { GoalPerformanceCheckerType } from "./index.ts";
import type { GoalPerformanceCheckerSpec } from "./spec.ts";
import { SampledActionSelectionType } from "./sampled-action-selection.ts";

/**
 * The named goals a character can be given. The enum rather than the specification is what a spec
 * carries and what a table slices by, so a goal has one stable identity: the workbook names it, and
 * rewording its label or retuning its configuration cannot silently repoint a requirement target.
 */
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

/** the rank every character has access to, so a run measures the spell they can all actually cast */
const ICE_BOLT_RANK = 1 as ActionRank;

export const ANALYSIS_GOAL_SPECS: Record<AnalysisGoal, GoalPerformanceCheckerSpec> = {
  [AnalysisGoal.TotalAccuracy]: { type: GoalPerformanceCheckerType.TotalAccuracy },

  [AnalysisGoal.WeaponAttackDamage]: {
    type: GoalPerformanceCheckerType.SampledDamageOnTargetDummy,
    actionSelection: { type: SampledActionSelectionType.WeaponAttacks },
    allocatableAttributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    equipmentScoreAxisNames: [
      "strength",
      "dexterity",
      "accuracy",
      "nonWeaponFlatDamage",
      "weaponDamageAverage",
    ],
  },

  /**
   * The parent, not the projectile: the parent overrides the projectile's hit outcome template with
   * the spell's damage calculation, while the projectile's own getter reads properties stashed on a
   * spawned action entity and throws for any other user.
   */
  [AnalysisGoal.IceBoltDamage]: {
    type: GoalPerformanceCheckerType.SampledDamageOnTargetDummy,
    actionSelection: {
      type: SampledActionSelectionType.NamedActions,
      actionNames: [CombatActionName.IceBoltParent],
      rank: ICE_BOLT_RANK,
    },
    // spirit for the damage a hit does, dexterity for landing it at all: the spell inherits the
    // ranged hit check, so its chance to hit is the caster's accuracy at a 0.9 modifier against
    // evasion, and accuracy is not point assignable — dexterity is the only allocation that buys it
    allocatableAttributes: [CombatAttribute.Spirit, CombatAttribute.Dexterity],
    // no flat damage axis: non-weapon flat damage is added only by the attack action's damage
    // calculation, so it does nothing for a spell
    equipmentScoreAxisNames: ["spirit", "accuracy", "dexterity"],
  },
};
