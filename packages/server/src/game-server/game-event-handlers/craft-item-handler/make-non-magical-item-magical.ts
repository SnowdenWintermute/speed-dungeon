import { ERROR_MESSAGES, Equipment, EquipmentBaseItem, ItemType } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";

export function makeNonMagicalItemMagical(equipment: Equipment) {
  if (Equipment.isMagical(equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  const gameServer = getGameServer();

  const builder = gameServer.itemGenerationBuilders[equipment.equipmentBaseItemProperties.type];
  const equipmentBaseItem = {
    equipmentType: equipment.equipmentBaseItemProperties.type,
    baseItemType: equipment.equipmentBaseItemProperties.baseItem,
  } as EquipmentBaseItem; // @TODO - this is error prone, refactor items code
  const affixesResult = builder.buildAffixes(equipment.itemLevel, equipmentBaseItem, {
    forcedIsMagical: true,
  });
  if (affixesResult instanceof Error) return affixesResult;

  equipment.affixes = affixesResult;
  const newName = builder.buildItemName(
    { type: ItemType.Equipment, baseItem: equipmentBaseItem },
    affixesResult
  );
  equipment.entityProperties.name = newName;
  console.log("new name: ", newName);
}
