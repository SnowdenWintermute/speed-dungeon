import {
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
  CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO,
} from "../../../app-consts.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatActionComponent } from "../index.js";

export function getStandardActionCritChance(
  actionUser: CombatantProperties,
  critChanceAttribute: CombatAttribute
) {
  const userAttributes = CombatantProperties.getTotalAttributes(actionUser);
  const userCritChanceAttributeValue =
    userAttributes[critChanceAttribute] * CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO;
  return userCritChanceAttributeValue + BASE_CRIT_CHANCE;
}

export function getStandardActionCritMultiplier(
  actionUser: CombatantProperties,
  critMultiplierAttribute: CombatAttribute
) {
  let critMultiplier = BASE_CRIT_MULTIPLIER;
  const userAttributes = CombatantProperties.getTotalAttributes(actionUser);
  const multiplierAttribute = userAttributes[critMultiplierAttribute] || 0;
  return critMultiplier + multiplierAttribute / 100;
}

export function getStandardActionManaCost(
  action: CombatActionComponent,
  user: CombatantProperties
): number {
  // const { manaCost, abilityLevelManaCostMultiplier, combatantLevelManaCostMultiplier } =
  //   abilityAttributes;
  // const adjustedForAbilityLevel = ability.level * (manaCost * abilityLevelManaCostMultiplier);

  // const adjustedForCombatantLevel = adjustedForAbilityLevel * combatantProperties.level;

  // return Math.floor(adjustedForCombatantLevel);
  //
  return 0;
}
