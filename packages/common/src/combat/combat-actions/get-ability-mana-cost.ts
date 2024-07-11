import { CombatantAbility, CombatantProperties } from "../../combatants";
import getAbilityAttributes from "../../combatants/abilities/get-ability-attributes";

export function getAbilityManaCost(
  combatantProperties: CombatantProperties,
  ability: CombatantAbility
): number {
  const abilityAttributes = getAbilityAttributes(ability.name);
  const { manaCost, abilityLevelManaCostMultiplier, combatantLevelManaCostMultiplier } =
    abilityAttributes;
  const adjustedForAbilityLevel = ability.level * (manaCost * abilityLevelManaCostMultiplier);
  const adjustedForCombatantLevel = adjustedForAbilityLevel * combatantProperties.level;

  return Math.floor(adjustedForCombatantLevel);
}
