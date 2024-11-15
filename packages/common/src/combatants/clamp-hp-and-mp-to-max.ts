import { CombatAttribute } from "./combat-attributes.js";
import { CombatantProperties } from "./combatant-properties.js";

export default function clampHpAndMpToMax(combatantProperties: CombatantProperties) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHp = totalAttributes[CombatAttribute.Hp];
  const maxMp = totalAttributes[CombatAttribute.Mp];

  if (combatantProperties.hitPoints > maxHp) combatantProperties.hitPoints = maxHp;
  if (combatantProperties.mana > maxMp) combatantProperties.mana = maxMp;
}
