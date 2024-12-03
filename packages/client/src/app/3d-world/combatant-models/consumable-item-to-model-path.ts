import { ConsumableType } from "@speed-dungeon/common";
import { Artist } from "./get-model-attribution";

export function consumableItemToModelPath(consumableType: ConsumableType): string | null {
  let filePath;
  const folderPath = "consumables/";
  filePath = CONSUMABLE_MODELS[consumableType];
  if (!folderPath || !filePath) return null;
  return folderPath + filePath;
}

export const CONSUMABLE_MODELS: Record<ConsumableType, { path: null | string; artist: Artist }> = {
  [ConsumableType.HpAutoinjector]: { path: "autoinjector.glb", artist: Artist.Snowden },
  [ConsumableType.MpAutoinjector]: { path: "autoinjector.glb", artist: Artist.Snowden },
};
