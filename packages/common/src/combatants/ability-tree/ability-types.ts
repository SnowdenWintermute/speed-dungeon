import { COMBATANT_TRAIT_DESCRIPTIONS, CombatantTraitType } from "../combatant-traits/index.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "../../combat/combat-actions/index.js";
import { AbilityTree } from "./ability-tree.js";
import { ERROR_MESSAGES } from "../../errors/index.js";

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
  static abilitiesAreEqual(a: AbilityTreeAbility, b: AbilityTreeAbility) {
    const typesAreEqual = a.type === b.type;
    if (!typesAreEqual) return false;
    if (a.type === AbilityType.Action && b.type === AbilityType.Action)
      return a.actionName === b.actionName;
    else if (a.type === AbilityType.Trait && b.type === AbilityType.Trait)
      return a.traitType === b.traitType;
    else return false;
  }

  static getCharacterLevelRequiredForFirstRank(
    abilityTree: AbilityTree,
    abilityToCheck: AbilityTreeAbility
  ) {
    for (const column of abilityTree.columns) {
      let rowIndex = -1;
      for (const ability of column) {
        rowIndex += 1;
        if (ability === undefined) continue;
        if (AbilityUtils.abilitiesAreEqual(ability, abilityToCheck)) {
          return (rowIndex + 1) * 2;
        }
      }
    }

    throw new Error("expected ability not found in the provided tree");
  }
}
