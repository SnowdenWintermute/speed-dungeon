import { CombatantAbility, CombatantAbilityName } from "./index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function getAbilityCostIfOwned(
  combatantProperties: CombatantProperties,
  abilityName: CombatantAbilityName
): Error | number {
  const abilityOption = combatantProperties.abilities[abilityName];
  if (!abilityOption) return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
  return getAbilityManaCost(combatantProperties, abilityOption);
}

export function getAbilityManaCost(
  combatantProperties: CombatantProperties,
  ability: CombatantAbility
): number {
  const abilityAttributes = CombatantAbility.getAttributes(ability.name);
  const { manaCost, abilityLevelManaCostMultiplier, combatantLevelManaCostMultiplier } =
    abilityAttributes;
  const abilityLevelAdjustedManaCost = ability.level * (manaCost * abilityLevelManaCostMultiplier);
  const combatantLevelManaCostAdjustment =
    combatantProperties.level * combatantLevelManaCostMultiplier;
  return abilityLevelAdjustedManaCost + combatantLevelManaCostAdjustment;
}
