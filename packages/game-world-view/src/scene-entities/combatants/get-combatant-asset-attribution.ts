import { CombatantProperties } from "@speed-dungeon/common";
import { ARTISTS, Artist, Attribution } from "../artists";
import { getCombatantSceneEntityPartCategoriesAndAssetPaths } from "./modular-parts-manager/asset-paths";

export function getCombatantModelAttributions(
  combatantProperties: CombatantProperties
): Attribution[] {
  const parts = getCombatantSceneEntityPartCategoriesAndAssetPaths(combatantProperties);

  const artists = new Set<Artist>();
  for (const part of parts) {
    if (part.artist !== null) {
      artists.add(part.artist);
    }
  }

  return Array.from(artists).map((artist) => ARTISTS[artist]);
}
