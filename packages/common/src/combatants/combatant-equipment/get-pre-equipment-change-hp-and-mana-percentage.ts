import { CombatAttribute } from "../attributes/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function getPreEquipmentChangeHpAndManaPercentage(combatantProperties: CombatantProperties) {
  const attributesBefore = combatantProperties.attributeProperties.getTotalAttributes();
  const maxHitPoints = attributesBefore[CombatAttribute.Hp];
  const maxMana = attributesBefore[CombatAttribute.Mp];
  const percentOfMaxHitPoints = combatantProperties.hitPoints / maxHitPoints;
  const percentOfMaxMana = combatantProperties.mana / maxMana;

  return { percentOfMaxHitPoints, percentOfMaxMana };
}
