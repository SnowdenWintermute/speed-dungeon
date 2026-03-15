import { AssetId, ConsumableType } from "@speed-dungeon/common";
import { Artist } from "./artists";

export function consumableItemToAssetId(consumableType: ConsumableType) {
  const folderPath = "consumables/";
  const filePath = CONSUMABLE_MODELS[consumableType].path;
  if (!folderPath || !filePath) return null;
  return (folderPath + filePath) as AssetId;
}

export const CONSUMABLE_MODELS: Record<ConsumableType, { path: null | string; artist: Artist }> = {
  [ConsumableType.HpAutoinjector]: { path: "autoinjector.glb", artist: Artist.Snowden },
  [ConsumableType.MpAutoinjector]: { path: "autoinjector.glb", artist: Artist.Snowden },
  [ConsumableType.StackOfShards]: {
    path: null,
    artist: Artist.Snowden,
  },
  [ConsumableType.WarriorSkillbook]: {
    path: null,
    artist: Artist.PublicDomain,
  },
  [ConsumableType.RogueSkillbook]: {
    path: null,
    artist: Artist.PublicDomain,
  },
  [ConsumableType.MageSkillbook]: {
    path: null,
    artist: Artist.PublicDomain,
  },
};
