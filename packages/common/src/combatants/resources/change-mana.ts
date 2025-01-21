import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../index.js";

export default function changeCombatantMana(
  combatantProperties: CombatantProperties,
  manaChange: number
) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxMana = totalAttributes[CombatAttribute.Mp] || 0;
  combatantProperties.mana = Math.max(0, Math.min(maxMana, combatantProperties.mana + manaChange));
}
