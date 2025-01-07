import { ERROR_MESSAGES, Equipment } from "@speed-dungeon/common";
import { getEquipmentGenerationTemplate } from "../../item-generation/equipment-templates/index.js";

export function addAffixToItem(equipment: Equipment, itemLevelLimiter: number) {
  // if not magical, reject
  // if has already 2 affixes, reject
  const missingPrefix = Equipment.hasSuffix(equipment) && !Equipment.hasPrefix(equipment);
  const missingSuffix = !Equipment.hasSuffix(equipment) && Equipment.hasPrefix(equipment);
  if (!Equipment.isMagical(equipment) || (!missingPrefix && !missingSuffix))
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);

  const template = getEquipmentGenerationTemplate(equipment.equipmentBaseItemProperties.baseItem);
  if (missingPrefix) {
    // const newPrefix =
  }

  // create it within a rolled tier that is no higher than Math.min(itemLevel, currentFloor)
}
