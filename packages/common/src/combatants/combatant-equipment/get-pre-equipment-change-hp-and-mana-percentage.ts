import { CombatantProperties } from "../index.js";
import { CombatAttribute } from "../attributes/index.js";

export function getPreEquipmentChangeHpAndManaPercentage(combatantProperties: CombatantProperties) {
  const attributesBefore = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPoints = attributesBefore[CombatAttribute.Hp];
  const maxMana = attributesBefore[CombatAttribute.Mp];
  const percentOfMaxHitPoints = combatantProperties.hitPoints / maxHitPoints;
  const percentOfMaxMana = combatantProperties.mana / maxMana;

  return { percentOfMaxHitPoints, percentOfMaxMana };
}
