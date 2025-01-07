import { Equipment, ItemType } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";

export function giveNewRandomAffixes(equipment: Equipment, itemLevelLimiter: number) {
  const gameServer = getGameServer();
  const { baseItem } = equipment.equipmentBaseItemProperties;
  const builder = gameServer.itemGenerationBuilders[baseItem.equipmentType];

  const affixesResult = builder.buildAffixes(
    Math.min(equipment.itemLevel, itemLevelLimiter),
    baseItem,
    {
      forcedIsMagical: true,
    }
  );
  if (affixesResult instanceof Error) return affixesResult;
  equipment.affixes = affixesResult;
  const newName = builder.buildItemName({ type: ItemType.Equipment, baseItem }, affixesResult);
  equipment.entityProperties.name = newName;
}
