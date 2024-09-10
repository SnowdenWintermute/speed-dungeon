import { DERIVED_ATTRIBUTE_RATIOS } from "../app_consts";
import { CombatAttribute } from "./combat-attributes";
import { CombatantProperties } from "./combatant-properties";

export function incrementAttributePoint(
  combatantProperties: CombatantProperties,
  attribute: CombatAttribute
) {
  combatantProperties.unspentAttributePoints -= 1;
  if (combatantProperties.speccedAttributes[attribute] === undefined)
    combatantProperties.speccedAttributes[attribute] = 0;
  combatantProperties.speccedAttributes[attribute]! += 1;

  const intToMpRatio = DERIVED_ATTRIBUTE_RATIOS[CombatAttribute.Intelligence]![CombatAttribute.Mp]!;
  if (attribute === CombatAttribute.Intelligence) combatantProperties.mana += intToMpRatio;
  const vitToHpRatio = DERIVED_ATTRIBUTE_RATIOS[CombatAttribute.Vitality]![CombatAttribute.Hp]!;
  if (attribute === CombatAttribute.Vitality) combatantProperties.hitPoints += vitToHpRatio;
}
