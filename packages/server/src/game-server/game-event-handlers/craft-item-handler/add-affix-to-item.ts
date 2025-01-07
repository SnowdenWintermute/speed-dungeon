import { ERROR_MESSAGES, Equipment, EquipmentBaseItem } from "@speed-dungeon/common";
import { getEquipmentGenerationTemplate } from "../../item-generation/equipment-templates/index.js";

export function addAffixToItem(equipment: Equipment, itemLevelLimiter: number) {
  // if not magical, reject
  // if has already 2 affixes, reject
  const missingPrefix = Equipment.hasSuffix(equipment) && !Equipment.hasPrefix(equipment);
  const missingSuffix = !Equipment.hasSuffix(equipment) && Equipment.hasPrefix(equipment);
  if (!Equipment.isMagical(equipment) || (!missingPrefix && !missingSuffix))
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);

  const equipmentBaseItem = {
    equipmentType: equipment.equipmentBaseItemProperties.type,
    baseItemType: equipment.equipmentBaseItemProperties.baseItem,
  } as EquipmentBaseItem; // @TODO - this may be error prone, refactor items code
  // such that we don't have to use type assertions. EquipmentBaseItem

  const template = getEquipmentGenerationTemplate(equipmentBaseItem);
  if (missingPrefix) {
    // const newPrefix =
  }

  // create it within a rolled tier that is no higher than Math.min(itemLevel, currentFloor)
}
