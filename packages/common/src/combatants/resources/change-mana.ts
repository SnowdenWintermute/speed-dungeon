import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function changeCombatantMana(combatantProperties: CombatantProperties, manaChange: number) {
  const maxMana = combatantProperties.attributeProperties.getAttributeValue(CombatAttribute.Mp);
  combatantProperties.mana = Math.max(0, Math.min(maxMana, combatantProperties.mana + manaChange));
}
