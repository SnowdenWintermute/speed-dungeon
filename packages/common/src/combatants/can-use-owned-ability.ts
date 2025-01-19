import { ABILITY_ATTRIBUTES, CombatantAbility, CombatantProperties } from "./index.js";
import { ActionUsableContext } from "../combat/combat-actions/index.js";

export function combatantCanUseOwnedAbility(
  combatantProperties: CombatantProperties,
  ability: CombatantAbility,
  isInCombat: boolean
) {
  const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];
  if (
    isInCombat &&
    abilityAttributes.combatActionProperties.usabilityContext === ActionUsableContext.OutOfCombat
  ) {
    return false;
  }
  if (
    !isInCombat &&
    abilityAttributes.combatActionProperties.usabilityContext === ActionUsableContext.InCombat
  ) {
    return false;
  }

  const manaCost = CombatantProperties.getAbilityManaCost(combatantProperties, ability);
  return combatantProperties.mana >= manaCost;
}
