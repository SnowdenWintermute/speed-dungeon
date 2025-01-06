import { ERROR_MESSAGES, Equipment, EquipmentBaseItem } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";

export function makeNonMagicalItemMagical(equipment: Equipment) {
  if (Equipment.isMagical(equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  const gameServer = getGameServer();

  const builder = gameServer.itemGenerationBuilders[equipment.equipmentBaseItemProperties.type];
  const affixesResult = builder.buildAffixes(equipment.itemLevel, {
    equipmentType: equipment.equipmentBaseItemProperties.type,
    baseItemType: equipment.equipmentBaseItemProperties.baseItem,
  } as EquipmentBaseItem); // @TODO - this is error prone, refactor items code
  if (affixesResult instanceof Error) return affixesResult;

  equipment.affixes = affixesResult;
}
