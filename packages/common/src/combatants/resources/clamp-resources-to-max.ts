import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function clampResourcesToMax(combatantProperties: CombatantProperties) {
  const totalAttributes = combatantProperties.attributeProperties.getTotalAttributes();
  const maxHp = totalAttributes[CombatAttribute.Hp];
  const maxMp = totalAttributes[CombatAttribute.Mp];

  if (combatantProperties.hitPoints > maxHp) combatantProperties.hitPoints = maxHp;
  if (combatantProperties.mana > maxMp) combatantProperties.mana = maxMp;
}
