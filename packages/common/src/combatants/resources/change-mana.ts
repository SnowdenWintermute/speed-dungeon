import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function changeCombatantMana(combatantProperties: CombatantProperties, manaChange: number) {
  const totalAttributes = combatantProperties.getTotalAttributes();
  const maxMana = totalAttributes[CombatAttribute.Mp] || 0;
  combatantProperties.mana = Math.max(0, Math.min(maxMana, combatantProperties.mana + manaChange));
}
