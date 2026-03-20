import { MonsterType } from "@speed-dungeon/common";

// this way some monsters that share the same model (species) can be different sizes

export const MONSTER_SCALING_SIZES: Record<MonsterType, number> = {
  [MonsterType.FireMage]: 1,
  [MonsterType.Cultist]: 1,
  [MonsterType.Wolf]: 1,
  [MonsterType.MantaRay]: 1,
  [MonsterType.Net]: 1,
  [MonsterType.Spider]: 0.15,
};
