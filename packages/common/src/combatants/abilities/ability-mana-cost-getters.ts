import { CombatantAbility, AbilityName } from "./index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatantProperties } from "../combatant-properties.js";
import { ABILITY_ATTRIBUTES } from "./get-ability-attributes.js";

export function getAbilityManaCostIfOwned(
  combatantProperties: CombatantProperties,
  abilityName: AbilityName
): Error | number {
  const abilityOption = combatantProperties.abilities[abilityName];
  if (!abilityOption) return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
  return getAbilityManaCostForCombatant(combatantProperties, abilityOption);
}

export function getAbilityManaCostForCombatant(
  combatantProperties: CombatantProperties,
  ability: CombatantAbility
): number {
  const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];
  const { manaCost, abilityLevelManaCostMultiplier, combatantLevelManaCostMultiplier } =
    abilityAttributes;
  const abilityLevelAdjustedManaCost = ability.level * (manaCost * abilityLevelManaCostMultiplier);
  const combatantLevelManaCostAdjustment =
    combatantProperties.level * combatantLevelManaCostMultiplier;
  return abilityLevelAdjustedManaCost + combatantLevelManaCostAdjustment;
}
