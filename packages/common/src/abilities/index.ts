import { MAX_ALLOCATABLE_ACTION_LEVEL } from "../app-consts.js";
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "../combat/index.js";
import {
  AbilityTree,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantTraitType,
} from "../combatants/index.js";

export enum AbilityType {
  Action,
  Trait,
}

export interface ActionAbility {
  type: AbilityType.Action;
  actionName: CombatActionName;
}

export interface TraitAbility {
  type: AbilityType.Trait;
  traitType: CombatantTraitType;
}

export type AbilityTreeAbility = ActionAbility | TraitAbility;

export function getAbilityTreeAbilityNameString(ability: AbilityTreeAbility) {
  switch (ability.type) {
    case AbilityType.Action:
      return COMBAT_ACTION_NAME_STRINGS[ability.actionName];
    case AbilityType.Trait:
      return COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].name;
  }
}

export class AbilityUtils {
  static getStringName(ability: AbilityTreeAbility) {
    switch (ability.type) {
      case AbilityType.Action:
        return COMBAT_ACTION_NAME_STRINGS[ability.actionName];
      case AbilityType.Trait:
        return COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].name;
    }
  }

  static abilitiesAreEqual(a: AbilityTreeAbility, b: AbilityTreeAbility) {
    const typesAreEqual = a.type === b.type;
    if (!typesAreEqual) return false;
    if (a.type === AbilityType.Action && b.type === AbilityType.Action)
      return a.actionName === b.actionName;
    else if (a.type === AbilityType.Trait && b.type === AbilityType.Trait)
      return a.traitType === b.traitType;
    else return false;
  }

  static getAbilityMaxAllocatableLevel(ability: AbilityTreeAbility) {
    switch (ability.type) {
      case AbilityType.Action:
        return MAX_ALLOCATABLE_ACTION_LEVEL;
      case AbilityType.Trait:
        return COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].maxLevel;
    }
  }

  static getCharacterLevelRequiredForFirstRank(
    abilityTree: AbilityTree,
    abilityToCheck: AbilityTreeAbility
  ) {
    for (const column of abilityTree.columns) {
      let rowIndex = 0;
      for (const ability of column) {
        rowIndex += 1;
        if (ability === undefined) continue;
        if (AbilityUtils.abilitiesAreEqual(ability, abilityToCheck)) {
          const requiredLevel = rowIndex * 2;
          return requiredLevel;
        }
      }
    }

    throw new Error("expected ability not found in the provided tree");
  }

  static getPrerequisites(ability: AbilityTreeAbility) {
    switch (ability.type) {
      case AbilityType.Action:
        return COMBAT_ACTIONS[ability.actionName].prerequisiteAbilities || [];
      case AbilityType.Trait:
        return COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].prerequisiteAbilities || [];
    }
  }

  static abilityAppearsInTree(ability: AbilityTreeAbility, abilityTree: AbilityTree) {
    for (const column of abilityTree.columns) {
      for (const abilityToCompare of column) {
        if (abilityToCompare === undefined) continue;
        if (AbilityUtils.abilitiesAreEqual(ability, abilityToCompare)) {
          return true;
        }
      }
    }

    return false;
  }
}
