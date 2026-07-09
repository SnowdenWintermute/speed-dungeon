import { MonsterType } from "../monsters/monster-types.js";
import { invariant } from "../utils/index.js";

export interface MonsterSpawnEntry {
  monster: MonsterType;
  weight: number;
}

export const FALLBACK_MONSTER_SPAWN_TABLE = [
  // { monster: MonsterType.Wolf, weight: 40 },
  // { monster: MonsterType.Zombie, weight: 60 },
  // { monster: MonsterType.Wolf, weight: 40 },
  { monster: MonsterType.SkeletonWarrior, weight: 100 },
];

export const MONSTER_SPAWN_TABLES: Record<number, MonsterSpawnEntry[]> = {
  1: FALLBACK_MONSTER_SPAWN_TABLE,
  2: [
    { monster: MonsterType.Slime, weight: 30 },
    { monster: MonsterType.Zombie, weight: 30 },
    { monster: MonsterType.Wolf, weight: 40 },
  ],
  3: [
    { monster: MonsterType.MantaRay, weight: 20 },
    { monster: MonsterType.Spider, weight: 10 },
    { monster: MonsterType.Wolf, weight: 70 },
  ],
};

// could move this to utils
export function pickWeighted<T extends { weight: number }>(items: readonly T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) {
      return item;
    }
  }

  const value = items[items.length - 1];
  invariant(value !== undefined);

  return value;
}

function validateMonsterTables(tables: Record<number, readonly MonsterSpawnEntry[]>): void {
  for (const [floor, entries] of Object.entries(tables)) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);

    if (total !== 100) {
      throw new Error(`Monster table for floor ${floor} has total weight ${total}, expected 100.`);
    }
  }
}

validateMonsterTables(MONSTER_SPAWN_TABLES);
