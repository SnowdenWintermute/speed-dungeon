// this way some monsters that share the same model (species) can be different sizes

import { MonsterType } from "./monster-types.js";

export const MONSTER_SCALING_SIZES: Partial<Record<MonsterType, number>> = {
  [MonsterType.FireMage]: 1,
  [MonsterType.Cultist]: 1,
  [MonsterType.Wolf]: 1,
  [MonsterType.MantaRay]: 1,
  [MonsterType.Net]: 1,
  [MonsterType.Spider]: 0.15,
  [MonsterType.Slime]: 0.4,
  [MonsterType.TyrantRex]: 0.21,
};
