import { ConsumableType } from "@speed-dungeon/common";
import { Artist } from "./artists";

export const CONSUMABLE_MODELS: Record<ConsumableType, { path: null | string; artist: Artist }> = {
  [ConsumableType.HpAutoinjector]: { path: "autoinjector.glb", artist: Artist.Snowden },
  [ConsumableType.MpAutoinjector]: { path: "autoinjector.glb", artist: Artist.Snowden },
  [ConsumableType.StackOfShards]: {
    path: null,
    artist: Artist.Snowden,
  },
};
