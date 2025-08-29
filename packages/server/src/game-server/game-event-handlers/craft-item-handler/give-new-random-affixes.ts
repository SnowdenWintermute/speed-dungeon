import { Equipment, ItemType } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons/index.js";

export function giveNewRandomAffixes(equipment: Equipment, itemLevelLimiter: number) {
  const gameServer = getGameServer();
  const { taggedBaseEquipment } = equipment.equipmentBaseItemProperties;
  const builder = gameServer.itemGenerationBuilders[taggedBaseEquipment.equipmentType];

  const affixesResult = builder.buildAffixes(
    Math.min(equipment.itemLevel, itemLevelLimiter),
    taggedBaseEquipment,
    {
      forcedIsMagical: true,
    }
  );
  if (affixesResult instanceof Error) return affixesResult;
  equipment.affixes = affixesResult;
  const newName = builder.buildItemName(
    { type: ItemType.Equipment, taggedBaseEquipment },
    affixesResult
  );
  equipment.entityProperties.name = newName;
}
