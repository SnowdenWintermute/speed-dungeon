import { CombatantAbilityName, CombatantProperties } from ".";
import { AbilityUsableContext } from "../combat/combat-actions/combat-action-properties";
import getAbilityAttributes from "./abilities/get-ability-attributes";

export default function getAbilityNamesFilteredByUseableContext(
  combatantProperties: CombatantProperties,
  excludedContext: null | AbilityUsableContext
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
