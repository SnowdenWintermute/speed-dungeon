import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionName,
} from "../combat/combat-actions/combat-action-names.js";
import { COMBATANT_TRAIT_DESCRIPTIONS } from "../combatants/combatant-traits/index.js";
import { CombatantTraitType } from "../combatants/combatant-traits/trait-types.js";
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

export function getAbilityTreeAbilityNameString(ability: AbilityTreeAbility) {
  switch (ability.type) {
    case AbilityType.Action:
      return COMBAT_ACTION_NAME_STRINGS[ability.actionName];
    case AbilityType.Trait:
      return COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].name;
  }
}

export const ABILITIES_GRANTED_WHEN_ACTION_ALLOCATED: Partial<
  Record<CombatActionName, Record<number, AbilityTreeAbility[]>>
> = {
  [CombatActionName.TamePet]: {
    1: [
      { type: AbilityType.Action, actionName: CombatActionName.SummonPetParent },
      { type: AbilityType.Action, actionName: CombatActionName.DismissPet },
      { type: AbilityType.Action, actionName: CombatActionName.ReleasePet },
    ],
    2: [
      { type: AbilityType.Action, actionName: CombatActionName.SummonPetParent },
      { type: AbilityType.Action, actionName: CombatActionName.DismissPet },
      { type: AbilityType.Action, actionName: CombatActionName.ReleasePet },

      { type: AbilityType.Action, actionName: CombatActionName.PetCommand },
    ],
    3: [
      { type: AbilityType.Action, actionName: CombatActionName.SummonPetParent },
      { type: AbilityType.Action, actionName: CombatActionName.DismissPet },
      { type: AbilityType.Action, actionName: CombatActionName.ReleasePet },
    ],
  },
};

export const ACTION_FORCED_RANKS: Partial<Record<CombatActionName, number>> = {
  [CombatActionName.PetCommand]: 4,
};
