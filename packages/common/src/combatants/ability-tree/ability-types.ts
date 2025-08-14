import { CombatantTraitType } from "../combatant-traits/index.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "../../combat/combat-actions/index.js";

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
      return "unimplemented trait strings";
  }
}
