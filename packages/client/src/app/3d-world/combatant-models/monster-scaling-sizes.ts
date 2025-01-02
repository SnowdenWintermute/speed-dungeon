import { MonsterType } from "@speed-dungeon/common";

// this way some monsters that share the same model (species) can be different sizes

export const MONSTER_SCALING_SIZES: Record<MonsterType, number> = {
  [MonsterType.MetallicGolem]: 0.5,
  [MonsterType.Zombie]: 0.25,
  [MonsterType.SkeletonArcher]: 0.2,
  [MonsterType.Scavenger]: 0.25,
  [MonsterType.Vulture]: 1,
  [MonsterType.FireMage]: 1,
  [MonsterType.Cultist]: 1,
  [MonsterType.FireElemental]: 1,
  [MonsterType.IceElemental]: 1,
};
