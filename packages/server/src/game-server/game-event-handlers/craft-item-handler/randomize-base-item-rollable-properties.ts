import {
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CraftingAction,
  ERROR_MESSAGES,
  Equipment,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons/index.js";

export function randomizeBaseItemRollableProperties(
  equipment: Equipment,
  itemLevelLimiter: number
) {
  const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Reform];

  if (shouldBeDisabled(equipment, itemLevelLimiter))
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  const builder =
    getGameServer().itemGenerationBuilders[equipment.equipmentBaseItemProperties.equipmentType];
  const newBaseItemPropertiesResult = builder.buildEquipmentBaseItemProperties(
    equipment.equipmentBaseItemProperties.taggedBaseEquipment
  );
  if (newBaseItemPropertiesResult instanceof Error) return newBaseItemPropertiesResult;
  equipment.equipmentBaseItemProperties = newBaseItemPropertiesResult;
}
