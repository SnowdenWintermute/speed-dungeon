import { MonsterType } from "@speed-dungeon/common/dist/monsters/monster-types";

// since there is an issue with drawing the bounding box for models
// scaled in blender and we want to be able to control the size
// of different monsters anyway, we can just adjust their size
// in babylon with this chart

export const MONSTER_SCALING_SIZES: Record<MonsterType, number> = {
  [MonsterType.MetallicGolem]: 1,
  [MonsterType.Zombie]: 0.25,
  [MonsterType.SkeletonArcher]: 0.2,
  [MonsterType.Scavenger]: 0.25,
  [MonsterType.Vulture]: 1,
  [MonsterType.FireMage]: 1,
  [MonsterType.Cultist]: 1,
  [MonsterType.FireElemental]: 1,
  [MonsterType.IceElemental]: 1,
};
