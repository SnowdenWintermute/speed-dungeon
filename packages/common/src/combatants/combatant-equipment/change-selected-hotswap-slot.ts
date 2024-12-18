import { CombatAttribute } from "../../attributes/index.js";
import { CombatantProperties } from "../index.js";
import { getPreEquipmentChangeHpAndManaPercentage } from "./get-pre-equipment-change-hp-and-mana-percentage.js";

export function changeSelectedHotswapSlot(
  combatantProperties: CombatantProperties,
  slotIndex: number
) {
  const { percentOfMaxHitPoints, percentOfMaxMana } =
    getPreEquipmentChangeHpAndManaPercentage(combatantProperties);

  combatantProperties.equipment.equippedHoldableHotswapSlotIndex = slotIndex;

  const attributesAfter = CombatantProperties.getTotalAttributes(combatantProperties);
  const maxHitPointsAfter = attributesAfter[CombatAttribute.Hp];
  const maxManaAfter = attributesAfter[CombatAttribute.Mp];

  combatantProperties.hitPoints = Math.round(maxHitPointsAfter * percentOfMaxHitPoints);
  combatantProperties.mana = Math.round(maxManaAfter * percentOfMaxMana);
}
