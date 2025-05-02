import { CombatantSpecies } from "../combatants/index.js";

export const SKELETON_FILE_PATHS: Record<CombatantSpecies, string> = {
  [CombatantSpecies.Humanoid]: "humanoid/humanoid-skeleton.glb",
  [CombatantSpecies.Dragon]: "monsters/dragon-main-skeleton.glb",
  [CombatantSpecies.Skeleton]: "monsters/skeleton-main-skeleton.glb",
  [CombatantSpecies.Velociraptor]: "monsters/velociraptor-main-skeleton.glb",
  [CombatantSpecies.Elemental]: "monsters/cube-main-skeleton.glb",
  [CombatantSpecies.Golem]: "monsters/wolf-main-skeleton.glb",
};
