import { Equipment, EquipmentBaseItem, ItemType } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";

export function giveNewRandomAffixes(equipment: Equipment, itemLevelLimiter: number) {
  const gameServer = getGameServer();
  const builder = gameServer.itemGenerationBuilders[equipment.equipmentBaseItemProperties.type];
  const equipmentBaseItem = {
    equipmentType: equipment.equipmentBaseItemProperties.type,
    baseItemType: equipment.equipmentBaseItemProperties.baseItem,
  } as EquipmentBaseItem; // @TODO - this is error prone, refactor items code
  const affixesResult = builder.buildAffixes(
    Math.min(equipment.itemLevel, itemLevelLimiter),
    equipmentBaseItem,
    {
      forcedIsMagical: true,
    }
  );
  if (affixesResult instanceof Error) return affixesResult;
  equipment.affixes = affixesResult;
  const newName = builder.buildItemName(
    { type: ItemType.Equipment, baseItem: equipmentBaseItem },
    affixesResult
  );
  equipment.entityProperties.name = newName;
}
