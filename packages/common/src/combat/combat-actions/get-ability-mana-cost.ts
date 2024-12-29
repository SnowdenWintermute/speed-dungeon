import { ABILITY_ATTRIBUTES } from "../../combatants/abilities/get-ability-attributes.js";
import { CombatantAbility, CombatantProperties } from "../../combatants/index.js";

export function getAbilityManaCost(
  combatantProperties: CombatantProperties,
  ability: CombatantAbility
): number {
  const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];
  const { manaCost, abilityLevelManaCostMultiplier, combatantLevelManaCostMultiplier } =
    abilityAttributes;
  const adjustedForAbilityLevel = ability.level * (manaCost * abilityLevelManaCostMultiplier);

  const adjustedForCombatantLevel = adjustedForAbilityLevel * combatantProperties.level;

  return Math.floor(adjustedForCombatantLevel);
}
