import { AbilityTreeAbility, AbilityType, AbilityUtils } from "../../abilities/index.js";
import { CombatActionName } from "../../combat/combat-actions/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatantTraitProperties } from "../combatant-traits/combatant-trait-properties.js";
import {
  ABILITY_TREES,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantClass,
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

  static ownedAbilityIsAtMaxAllocatableLevel(
    combatantProperties: CombatantProperties,
    ability: AbilityTreeAbility
  ) {
    const abilityLevel = CombatantAbilityProperties.getAbilityLevel(combatantProperties, ability);
    const maxAllocatableLevel = AbilityUtils.getAbilityMaxAllocatableLevel(ability);
    if (abilityLevel >= maxAllocatableLevel) return true;
    return false;
  }

  static isRequiredCharacterLevelToAllocateToAbility(
    combatantProperties: CombatantProperties,
    ability: AbilityTreeAbility,
    isSupportClass: boolean
  ) {
    const abilityLevel = CombatantAbilityProperties.getAbilityLevel(combatantProperties, ability);
    // const characterLevel = isSupportClass ? combatantProperties.supportClassProperties?.level || 0: combatantProperties.level;
    let characterLevel: number = 0;
    let combatantClass: CombatantClass;
    if (isSupportClass) {
      const { supportClassProperties } = combatantProperties;
      if (supportClassProperties === null) throw new Error("expected support class not found");
      characterLevel = supportClassProperties.level;
      combatantClass = supportClassProperties.combatantClass;
    } else {
      characterLevel = combatantProperties.level;
      combatantClass = combatantProperties.combatantClass;
    }

    const abilityTree = ABILITY_TREES[combatantClass];
    const characterLevelRequiredForFirstRank = AbilityUtils.getCharacterLevelRequiredForFirstRank(
      abilityTree,
      ability
    );
    const characterLevelRequired = characterLevelRequiredForFirstRank + abilityLevel;
    return characterLevel >= characterLevelRequired;
  }

  static hasPrerequisiteAbilities(
    combatantProperties: CombatantProperties,
    ability: AbilityTreeAbility
  ) {
    for (const prerequisite of AbilityUtils.getPrerequisites(ability)) {
      if (CombatantAbilityProperties.getAbilityLevel(combatantProperties, prerequisite) < 1)
        return false;
    }
    return true;
  }

  static canAllocateAbilityPoint(
    combatantProperties: CombatantProperties,
    ability: AbilityTreeAbility,
    isSupportClass: boolean
  ): { canAllocate: boolean; reasonCanNot?: string } {
    if (
      ability.type === AbilityType.Trait &&
      !COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].isAllocatable
    ) {
      return {
        canAllocate: false,
        reasonCanNot: "That trait is inherent to the combatant and can not be allocated to",
      };
    }
    // has unspent points
    if (combatantProperties.abilityProperties.unspentAbilityPoints <= 0)
      return { canAllocate: false, reasonCanNot: "No unspent ability points" };
    // ability is max level
    const isAtMaxAllocatableLevel = CombatantAbilityProperties.ownedAbilityIsAtMaxAllocatableLevel(
      combatantProperties,
      ability
    );
    if (isAtMaxAllocatableLevel)
      return { canAllocate: false, reasonCanNot: "That ability is at its maximum level" };
    // is required character level
    const isAtRequiredCharacterLevel =
      CombatantAbilityProperties.isRequiredCharacterLevelToAllocateToAbility(
        combatantProperties,
        ability,
        isSupportClass
      );
    if (!isAtRequiredCharacterLevel)
      return {
        canAllocate: false,
        reasonCanNot: "That character is too low level to allocate to this ability",
      };
    // has prerequisite abilities
    const hasPrerequisiteAbilities = CombatantAbilityProperties.hasPrerequisiteAbilities(
      combatantProperties,
      ability
    );
    if (!hasPrerequisiteAbilities)
      return {
        canAllocate: false,
        reasonCanNot: "Requires prerequisite",
      };

    return { canAllocate: true };
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
