import { CombatantAbilityName, CombatantProperties } from "./index.js";
import { ActionUsableContext } from "../combat/combat-actions/combat-action-properties.js";
import getAbilityAttributes from "./abilities/get-ability-attributes.js";

export default function getAbilityNamesFilteredByUseableContext(
  combatantProperties: CombatantProperties,
  excludedContext: null | ActionUsableContext
): CombatantAbilityName[] {
  const toReturn: CombatantAbilityName[] = [];

  for (const abilityNameKey in combatantProperties.abilities) {
    const abilityName = parseInt(abilityNameKey) as CombatantAbilityName;
    const abilityAtributes = getAbilityAttributes(abilityName);
    if (
      excludedContext !== abilityAtributes.combatActionProperties.usabilityContext &&
      abilityName !== CombatantAbilityName.AttackRangedMainhand &&
      abilityName !== CombatantAbilityName.AttackMeleeOffhand &&
      abilityName !== CombatantAbilityName.AttackMeleeMainhand
    )
      toReturn.push(abilityName);
  }

  return toReturn;
}
