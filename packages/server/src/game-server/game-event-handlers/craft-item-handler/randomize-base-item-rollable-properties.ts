import { Equipment } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";

export function randomizeBaseItemRollableProperties(
  equipment: Equipment,
  _itemLevelLimiter: number
) {
  const builder =
    getGameServer().itemGenerationBuilders[equipment.equipmentBaseItemProperties.equipmentType];
  const newBaseItemPropertiesResult = builder.buildEquipmentBaseItemProperties(
    equipment.equipmentBaseItemProperties.taggedBaseEquipment
  );
  if (newBaseItemPropertiesResult instanceof Error) return newBaseItemPropertiesResult;
  equipment.equipmentBaseItemProperties = newBaseItemPropertiesResult;
}
