import { ConsumableType } from "@speed-dungeon/common";
import { CONSUMABLE_MODELS } from "./consumable-models";

export function consumableItemToModelPath(consumableType: ConsumableType): string | null {
  let filePath;
  const folderPath = "consumables/";
  filePath = CONSUMABLE_MODELS[consumableType].path;
  if (!folderPath || !filePath) return null;
  return folderPath + filePath;
}
