import { AbilityName, CombatantProperties } from "./index.js";
import { ActionUsableContext } from "../combat/combat-actions/combat-action-properties.js";
import { ABILITY_ATTRIBUTES } from "./abilities/get-ability-attributes.js";

export default function getAbilityNamesFilteredByUseableContext(
  combatantProperties: CombatantProperties,
  excludedContext: null | ActionUsableContext
): AbilityName[] {
  const toReturn: AbilityName[] = [];

  for (const abilityNameKey in combatantProperties.abilities) {
    const abilityName = parseInt(abilityNameKey) as AbilityName;
    const abilityAtributes = ABILITY_ATTRIBUTES[abilityName];
    if (
      excludedContext !== abilityAtributes.combatActionProperties.usabilityContext &&
      abilityName !== AbilityName.AttackRangedMainhand &&
      abilityName !== AbilityName.AttackMeleeOffhand &&
      abilityName !== AbilityName.AttackMeleeMainhand
    )
      toReturn.push(abilityName);
  }

  return toReturn;
}
