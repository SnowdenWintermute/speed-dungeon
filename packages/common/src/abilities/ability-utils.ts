import cloneDeep from "lodash.clonedeep";
import { MAX_ALLOCATABLE_ACTION_LEVEL } from "../app-consts.js";
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS } from "../combat/index.js";
import {
  ABILITY_TREES,
  AbilityTree,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantClass,
} from "../combatants/index.js";
import { AbilityType } from "./ability-types.js";
import { AbilityTreeAbility } from "./index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";

let ABILITY_CLASS_AND_LEVEL_REQUIREMENTS: Record<
  string,
  {
    combatantClass: CombatantClass;
    level: number;
  }
>;

export class AbilityUtils {
  static getClassAndLevelRequirements(ability: AbilityTreeAbility, abilityRank: number) {
    if (!ABILITY_CLASS_AND_LEVEL_REQUIREMENTS)
      ABILITY_CLASS_AND_LEVEL_REQUIREMENTS = this.generateClassAndLevelRequirements();
    const requirements = cloneDeep(ABILITY_CLASS_AND_LEVEL_REQUIREMENTS[JSON.stringify(ability)]);
    if (requirements === undefined) throw new Error("ability not found");
    requirements.level = requirements.level + abilityRank - 1;
    return requirements;
  }
  static getStringName(ability: AbilityTreeAbility) {
    switch (ability.type) {
      case AbilityType.Action:
        return COMBAT_ACTION_NAME_STRINGS[ability.actionName];
      case AbilityType.Trait:
        return COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].name;
    }
  }

  static generateClassAndLevelRequirements() {
    const toReturn: Record<string, { combatantClass: CombatantClass; level: number }> = {};
    for (const [combatantClass, tree] of iterateNumericEnumKeyedRecord(ABILITY_TREES)) {
      for (const column of tree.columns) {
        for (const ability of column) {
          if (ability === undefined) continue;
          const characterLevelRequiredForFirstRank = this.getCharacterLevelRequiredForFirstRank(
            tree,
            ability
          );
          toReturn[JSON.stringify(ability)] = {
            combatantClass,
            level: characterLevelRequiredForFirstRank,
          };
        }
      }
    }
    return toReturn;
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
