import { MonsterType } from "../monsters/monster-types.js";

export interface MonsterSpawnEntry {
  monster: MonsterType;
  weight: number;
}

export const FALLBACK_MONSTER_SPAWN_TABLE = [
  // { monster: MonsterType.Wolf, weight: 35 },
  // { monster: MonsterType.Zombie, weight: 35 },
  // // { monster: MonsterType.SkeletonWarrior, weight: 10 },
  // { monster: MonsterType.VampireBat, weight: 30 },
  { monster: MonsterType.TyrantRex, weight: 100 },
];

export const MONSTER_SPAWN_TABLES: Record<number, MonsterSpawnEntry[]> = {
  1: FALLBACK_MONSTER_SPAWN_TABLE,
  2: [
    { monster: MonsterType.Slime, weight: 10 },
    { monster: MonsterType.Zombie, weight: 30 },
    { monster: MonsterType.SkeletonWarrior, weight: 20 },
    { monster: MonsterType.Wolf, weight: 40 },
  ],
  3: [
    { monster: MonsterType.MantaRay, weight: 10 },
    { monster: MonsterType.Slime, weight: 20 },
    { monster: MonsterType.Spider, weight: 20 },
    { monster: MonsterType.Wolf, weight: 20 },
    { monster: MonsterType.SkeletonWarrior, weight: 20 },
    { monster: MonsterType.SkeletonCaptain, weight: 10 },
  ],
};

function validateMonsterTables(tables: Record<number, readonly MonsterSpawnEntry[]>): void {
  for (const [floor, entries] of Object.entries(tables)) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);

    if (total !== 100) {
      throw new Error(`Monster table for floor ${floor} has total weight ${total}, expected 100.`);
    }
  }
}

validateMonsterTables(MONSTER_SPAWN_TABLES);
