import { CombatAttribute } from "./combat-attributes";
import { CombatantProperties } from "./combatant-properties";

export default function changeCombatantMana(
  combatantProperties: CombatantProperties,
  manaChange: number
) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxMana = totalAttributes[CombatAttribute.Mp] || 0;
  combatantProperties.mana = Math.max(
    0,
    Math.min(maxMana, combatantProperties.hitPoints + manaChange)
  );
}
