import { EquipmentSlot } from "../../items/index.js";
import { CombatAttribute } from "./../combat-attributes.js";
import { CombatantProperties } from "./../combatant-properties.js";

export function unequipSlots(combatantProperties: CombatantProperties, slots: EquipmentSlot[]) {
  const unequippedItemIds: string[] = [];

  const attributesBefore = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPoints = attributesBefore[CombatAttribute.Hp];
  const maxMana = attributesBefore[CombatAttribute.Mp];
  const percentOfMaxHitPoints = combatantProperties.hitPoints / maxHitPoints;
  const percentOfMaxMana = combatantProperties.mana / maxMana;

  for (const slot of slots) {
    const itemOption = combatantProperties.equipment[slot];
    if (itemOption === undefined) continue;

    combatantProperties.inventory.items.push(itemOption);
    unequippedItemIds.push(itemOption.entityProperties.id);
    delete combatantProperties.equipment[slot];
  }

  const attributesAfter = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPointsAfter = attributesAfter[CombatAttribute.Hp];
  const maxManaAfter = attributesAfter[CombatAttribute.Mp];

  combatantProperties.hitPoints = Math.round(maxHitPointsAfter * percentOfMaxHitPoints);
  combatantProperties.mana = Math.round(maxManaAfter * percentOfMaxMana);

  // CombatantProperties.clampHpAndMpToMax(combatantProperties);

  return unequippedItemIds;
}
