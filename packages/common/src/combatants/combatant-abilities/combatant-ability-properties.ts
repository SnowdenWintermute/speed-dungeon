import { CombatActionName } from "../../combat/combat-actions/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatantTraitProperties } from "../combatant-traits/combatant-trait-properties.js";
import {
  ABILITY_TREES,
  AbilityTreeAbility,
  AbilityType,
  AbilityUtils,
  CombatantProperties,
} from "../index.js";
import { CombatantActionState } from "../owned-actions/combatant-action-state.js";

export class CombatantAbilityProperties {
  constructor() {}
  ownedActions: Partial<Record<CombatActionName, CombatantActionState>> = {};
  unspentAbilityPoints: number = 0;
  traitProperties = new CombatantTraitProperties();

  static getOwnedActionState(
    combatantProperties: CombatantProperties,
    actionName: CombatActionName
  ): Error | CombatantActionState {
    const ownedActionStateOption = combatantProperties.abilityProperties.ownedActions[actionName];
    if (!ownedActionStateOption) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
    return ownedActionStateOption;
  }

  static getAbilityLevel(combatantProperties: CombatantProperties, ability: AbilityTreeAbility) {
    const { abilityProperties } = combatantProperties;
    switch (ability.type) {
      case AbilityType.Action:
        return abilityProperties.ownedActions[ability.actionName]?.level || 0;
      case AbilityType.Trait:
        const { speccedTraitLevels, inherentTraitLevels } = abilityProperties.traitProperties;
        return (
          (speccedTraitLevels[ability.traitType] || 0) +
          (inherentTraitLevels[ability.traitType] || 0)
        );
    }
  }

  static canAllocateAbilityPoint(
    combatantProperties: CombatantProperties,
    ability: AbilityTreeAbility
  ) {
    // ability is max level
    const abilityLevel = CombatantAbilityProperties.getAbilityLevel(combatantProperties, ability);
    // is required character level
    const characterLevel = combatantProperties.level;
    const mainClassAbilityTree = ABILITY_TREES[combatantProperties.combatantClass];
    const characterLevelRequiredForFirstRank = AbilityUtils.getCharacterLevelRequiredForFirstRank(
      mainClassAbilityTree,
      ability
    );
    const characterLevelRequired = characterLevelRequiredForFirstRank + abilityLevel - 1;
    if (characterLevel >= characterLevelRequired) return true;
    // has prerequisite abilities

    return false;
  }

  static allocateAbilityPoint(
    combatantProperties: CombatantProperties,
    ability: AbilityTreeAbility
  ) {
    const { abilityProperties } = combatantProperties;
    const { ownedActions, traitProperties } = abilityProperties;
    abilityProperties.unspentAbilityPoints -= 1;
    switch (ability.type) {
      case AbilityType.Action:
        const existingActionOption = ownedActions[ability.actionName];
        if (existingActionOption) existingActionOption.level += 1;
        else ownedActions[ability.actionName] = new CombatantActionState(ability.actionName);
        break;
      case AbilityType.Trait:
        const existingTraitLevel = traitProperties.speccedTraitLevels[ability.traitType];
        if (existingTraitLevel !== undefined)
          traitProperties.speccedTraitLevels[ability.traitType] = existingTraitLevel + 1;
        else traitProperties.speccedTraitLevels[ability.traitType] = 1;
    }
  }
}
