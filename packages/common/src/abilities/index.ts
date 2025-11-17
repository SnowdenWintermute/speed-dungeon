import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "../combat/index.js";
import { CombatantTraitType } from "../combatants/combatant-traits/trait-types.js";
import { COMBATANT_TRAIT_DESCRIPTIONS } from "../combatants/index.js";
import { AbilityType } from "./ability-types.js";
export * from "./ability-types.js";
export * from "./ability-utils.js";

export interface ActionAbility {
  type: AbilityType.Action;
  actionName: CombatActionName;
}

export interface TraitAbility {
  type: AbilityType.Trait;
  traitType: CombatantTraitType;
}

export type AbilityTreeAbility = ActionAbility | TraitAbility;

export function abilityTreeAbilitiesAreEqual(a: AbilityTreeAbility, b: AbilityTreeAbility) {
  if (a.type === AbilityType.Action && b.type === AbilityType.Action) {
    if (a.type === AbilityType.Action && a.actionName === b.actionName) return true;
    return false;
  } else if (a.type === AbilityType.Trait && b.type === AbilityType.Trait) {
    if (a.traitType === b.traitType) return true;
    return false;
  }
  return false;
}

export function getAbilityTreeAbilityNameString(ability: AbilityTreeAbility) {
  switch (ability.type) {
    case AbilityType.Action:
      return COMBAT_ACTION_NAME_STRINGS[ability.actionName];
    case AbilityType.Trait:
      return COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].name;
  }
}
