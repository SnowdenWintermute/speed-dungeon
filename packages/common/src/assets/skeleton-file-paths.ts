import { CombatantSpecies } from "../combatants/combatant-species.js";

export const SKELETON_FILE_PATHS: Record<CombatantSpecies, string> = {
  [CombatantSpecies.Humanoid]: "humanoid/humanoid-skeleton.glb",
  [CombatantSpecies.Canine]: "monsters/wolf-main-skeleton.glb",
  [CombatantSpecies.Ray]: "monsters/manta-ray-main-skeleton.glb",
  [CombatantSpecies.Net]: "effects/net-main-skeleton.glb",
  [CombatantSpecies.Spider]: "monsters/spider-main-skeleton.glb",
};
