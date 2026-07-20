import { MonsterType } from "./monster-types.js";

export const MONSTER_LAIR_GENERATION_CAPACITY_BUDGET_COST: Record<MonsterType, number> = {
  [MonsterType.Wolf]: 0.33,
  [MonsterType.FireMage]: 0.33,
  [MonsterType.Cultist]: 0.33,
  [MonsterType.MantaRay]: 0.4,
  [MonsterType.Net]: 0.2,
  [MonsterType.Spider]: 0.33,
  [MonsterType.Slime]: 0.33,
  [MonsterType.Zombie]: 0.33,
  [MonsterType.SkeletonWarrior]: 0.33,
  [MonsterType.SkeletonCaptain]: 0.5,
  [MonsterType.VampireBat]: 0.25,
  [MonsterType.TyrantRex]: 1,
};

export const MONSTER_PALETTE_COST: Record<MonsterType, number> = {
  [MonsterType.Wolf]: 1,
  [MonsterType.FireMage]: 1.5,
  [MonsterType.Cultist]: 1,
  [MonsterType.MantaRay]: 1,
  [MonsterType.Net]: 1,
  [MonsterType.Spider]: 1,
  [MonsterType.Slime]: 1,
  [MonsterType.Zombie]: 1,
  [MonsterType.SkeletonWarrior]: 1,
  [MonsterType.SkeletonCaptain]: 2,
  [MonsterType.VampireBat]: 1,
  [MonsterType.TyrantRex]: 3,
};
