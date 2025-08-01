import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../index.js";

export function clampResourcesToMax(combatantProperties: CombatantProperties) {
  const totalAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHp = totalAttributes[CombatAttribute.Hp];
  const maxMp = totalAttributes[CombatAttribute.Mp];

  if (combatantProperties.hitPoints > maxHp) combatantProperties.hitPoints = maxHp;
  if (combatantProperties.mana > maxMp) combatantProperties.mana = maxMp;
}
